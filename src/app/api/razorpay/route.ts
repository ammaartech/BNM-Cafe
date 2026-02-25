import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const { amount, receipt } = await req.json();

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        // Razorpay amount is in paise (₹1 = 100 paise)
        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ order }, { status: 200 });
    } catch (error) {
        console.error("Razorpay Error:", error);
        return NextResponse.json(
            { error: "Error creating Razorpay order" },
            { status: 500 }
        );
    }
}
