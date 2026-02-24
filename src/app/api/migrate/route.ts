import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // We use a raw query if possible, but JS client doesn't support raw SQL easily unless we created a function.
        // Instead we will just guide the user to run it since our previous attempts to hack it via CLI/JS failed.
        return NextResponse.json({ message: "Please run manually in Supabase SQL editor: ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
