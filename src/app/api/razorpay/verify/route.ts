import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const razorpay_payment_id = formData.get("razorpay_payment_id") as string;
        const razorpay_order_id = formData.get("razorpay_order_id") as string;
        const razorpay_signature = formData.get("razorpay_signature") as string;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            console.error("Invalid Razorpay signature in callback");
            return NextResponse.redirect(new URL("/cart?error=PaymentVerificationFailed", req.url));
        }

        // Fetch Razorpay order to get the receipt (which is our Supabase order ID)
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const supabaseOrderId = order.receipt;

        if (!supabaseOrderId) {
            console.error("No receipt found in Razorpay order");
            return NextResponse.redirect(new URL("/cart?error=MissingOrderMapping", req.url));
        }

        // Update Supabase using Service Role Key to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        // Fallback to anon key if service role key is not available, but it might fail due to RLS
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from("orders")
            .update({
                payment_status: "PAID",
                payment_method: "RAZORPAY"
            })
            .eq("id", supabaseOrderId);

        if (error) {
            console.error("Failed to update order in Supabase:", error);
        }

        // Redirect user to the order ticket page!
        return NextResponse.redirect(new URL(`/orders/${supabaseOrderId}?payment_success=true`, req.url));
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        return NextResponse.redirect(new URL("/cart?error=ServerVerificationFailed", req.url));
    }
}
