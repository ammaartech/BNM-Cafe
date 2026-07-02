import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const { receipt } = await req.json();

        // `receipt` is our Supabase order id — the amount is always read from the
        // database, never from the client, so a tampered request cannot create a
        // Razorpay order for less than the real total.
        if (!receipt || typeof receipt !== "string") {
            return NextResponse.json({ error: "Order id (receipt) is required" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not configured; cannot create payment order.");
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: order, error } = await supabase
            .from("orders")
            .select("total_amount, payment_status")
            .eq("id", receipt)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        if (order.payment_status !== "PENDING") {
            return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 409 });
        }

        // Razorpay amount is in paise (₹1 = 100 paise)
        const options = {
            amount: Math.round(Number(order.total_amount) * 100),
            currency: "INR",
            receipt,
        };

        const razorpay = getRazorpay();
        const rzpOrder = await razorpay.orders.create(options);

        return NextResponse.json({ order: rzpOrder }, { status: 200 });
    } catch (error) {
        console.error("Razorpay Error:", error);
        return NextResponse.json(
            { error: "Error creating Razorpay order" },
            { status: 500 }
        );
    }
}
