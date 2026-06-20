import Razorpay from "razorpay";

/**
 * Lazily construct the Razorpay client. Must be called inside a request handler,
 * never at module scope — the constructor throws if keys are missing, which would
 * crash `next build` when it evaluates the route (env vars aren't present at build time).
 */
export function getRazorpay() {
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error("Razorpay keys are not configured");
    }

    return new Razorpay({ key_id, key_secret });
}
