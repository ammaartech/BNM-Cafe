import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Very basic security: check a secret key if you configure one in SmsForwarder
        const configuredSecret = process.env.WEBHOOK_SECRET;
        if (configuredSecret && payload.secret !== configuredSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const message = payload.message || payload.text || payload.content || '';
        if (!message) {
            return NextResponse.json({ error: 'No message content' }, { status: 400 });
        }

        // Extremely generous regex to find an amount (e.g., Rs. 150.00, INR 150, ₹150.00)
        // Also captures things like "received 150"
        let amountMatch = message.match(/(?:Rs\.?|INR|₹)\s*(\d+(?:\.\d+)?)/i);

        // If strict match fails, look for the word "credited" or "received" near a number
        if (!amountMatch) {
            amountMatch = message.match(/(?:received|credited).*?(\d+(?:\.\d+)?)/i);
        }

        if (!amountMatch) {
            return NextResponse.json({ error: 'Could not extract amount from message' }, { status: 400 });
        }

        const amount = parseFloat(amountMatch[1]);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid extracted amount' }, { status: 400 });
        }

        // Calculate time boundary (last 15 minutes)
        // Note: The 'orders' table has a 'created_at' or 'orderDate' column?
        // Let's check the schema. Wait, my order type has 'orderDate'.
        // Let's look up orders that are PENDING and match this amount exactly.

        const { data: pendingOrders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_status', 'PENDING')
            .eq('totalAmount', amount) // Note: Supabase col is likely totalAmount or total_amount, we'll try to use what matches the type.
            .order('orderDate', { ascending: false })
            .limit(10); // get top 10

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: 'Database error fetching orders' }, { status: 500 });
        }

        if (!pendingOrders || pendingOrders.length === 0) {
            // Also try 'total_amount' if the column is snake_case in db
            const { data: snakeCaseOrders, error: snakeError } = await supabase
                .from('orders')
                .select('*')
                .eq('payment_status', 'PENDING')
                .eq('total_amount', amount)
                .order('order_date', { ascending: false }) // Attempt snake_case
                .limit(1);

            if (!snakeError && snakeCaseOrders && snakeCaseOrders.length > 0) {
                const targetOrder = snakeCaseOrders[0];
                await supabase.from('orders').update({ payment_status: 'PAID' }).eq('id', targetOrder.id);
                return NextResponse.json({ success: true, orderId: targetOrder.id, message: 'Matched via snake_case' });
            }

            return NextResponse.json({ error: 'No pending order found for this amount' }, { status: 404 });
        }

        // We have a match! Let's pick the most recent one.
        const targetOrder = pendingOrders[0];

        const { error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'PAID' })
            .eq('id', targetOrder.id);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, orderId: targetOrder.id, amount });

    } catch (err: any) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
