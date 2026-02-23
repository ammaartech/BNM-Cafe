import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { UPIQR } from "@adityavijay21/upiqr";
import { useSupabase } from "@/lib/supabase/provider";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "BNM Cafe";

interface UserPaymentDialogProps {
    orderId: string | null;
    totalPrice: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentConfirmed: (orderId: string) => Promise<void>;
}

type PaymentStatus = "awaiting" | "confirming" | "confirmed";

export function UserPaymentDialog({
    orderId,
    totalPrice,
    open,
    onOpenChange,
    onPaymentConfirmed,
}: UserPaymentDialogProps) {
    const { supabase } = useSupabase();

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [upiIntent, setUpiIntent] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("awaiting");

    const generateQR = useCallback(async () => {
        if (!UPI_ID || totalPrice <= 0) return;
        setIsGenerating(true);
        setQrDataUrl(null);
        try {
            const { qr, intent } = await new UPIQR()
                .set({
                    upiId: UPI_ID,
                    name: UPI_NAME,
                    amount: parseFloat(totalPrice.toFixed(2)),
                    transactionNote: "BNM Cafe Order",
                    transactionRef: orderId || undefined,
                })
                .setOptions({
                    width: 256,
                    errorCorrectionLevel: "H",
                    color: {
                        dark: "#000000FF",
                        light: "#FFFFFFFF",
                    },
                })
                .generate();
            setQrDataUrl(qr);
            setUpiIntent(intent);
        } catch (err) {
            console.error("Failed to generate QR:", err);
        } finally {
            setIsGenerating(false);
        }
    }, [totalPrice, orderId]);

    // Generate QR whenever dialog opens and we have an order ID
    useEffect(() => {
        if (open && orderId && paymentStatus === "awaiting") {
            generateQR();
        }
    }, [open, orderId, generateQR, paymentStatus]);

    // Listen to Supabase Realtime for Webhook Updates
    useEffect(() => {
        if (!open || !orderId || !supabase) return;

        const channel = supabase
            .channel(`user-payment-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    const newStatus = payload.new.payment_status;
                    if (newStatus === 'PAID') {
                        setPaymentStatus("confirmed");
                        onPaymentConfirmed(orderId);
                        setTimeout(() => {
                            onOpenChange(false);
                        }, 2500);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [open, orderId, supabase, onPaymentConfirmed, onOpenChange]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setPaymentStatus("awaiting");
            setQrDataUrl(null);
        }
    }, [open]);

    const handleOpenGenericUpi = () => {
        if (upiIntent) {
            window.location.href = upiIntent;
        }
    };

    const handleOpenGPay = () => {
        if (upiIntent) {
            // Replace generic upi:// with GPay's scheme or just use upi:// but sometimes it's ambiguous
            // Google Pay sometimes handles tez:// or gpay:// well. However, on Android upi:// allows selection.
            // On iOS, gpay://upi/pay?... is more direct if the app is installed.
            const gpayLink = upiIntent.replace('upi://', 'gpay://upi/');
            window.location.href = gpayLink;

            // Fallback in case gpay doesn't work, though we can't really "catch" it easily
            setTimeout(() => {
                window.location.href = upiIntent; // Try generic if specific fails
            }, 500);
        }
    };

    const handleOpenPhonePe = () => {
        if (upiIntent) {
            const phonepeLink = upiIntent.replace('upi://', 'phonepe://');
            window.location.href = phonepeLink;

            setTimeout(() => {
                window.location.href = upiIntent;
            }, 500);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center flex flex-col items-center">
                <DialogHeader className="w-full">
                    <DialogTitle className="text-center text-2xl">Pay via UPI</DialogTitle>
                    <DialogDescription className="text-center">
                        Scan the QR code below or open your UPI app to complete the payment.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center min-h-[250px] w-full">
                    {paymentStatus === "confirmed" ? (
                        <div className="flex flex-col items-center gap-4 text-green-600 animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-24 h-24" />
                            <p className="text-xl font-bold">Payment Successful!</p>
                            <p className="text-sm text-foreground">Redirecting...</p>
                        </div>
                    ) : (
                        <>
                            {isGenerating && !qrDataUrl && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                                    <p className="text-muted-foreground">Generating QR Code...</p>
                                </div>
                            )}

                            {qrDataUrl && (
                                <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-500">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                                        <Image
                                            src={qrDataUrl}
                                            alt="UPI QR Code"
                                            width={220}
                                            height={220}
                                            className="mx-auto"
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Total Amount</span>
                                        <span className="text-4xl font-bold">₹{totalPrice.toFixed(2)}</span>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-3 mt-2 sm:flex sm:flex-col sm:px-8">
                                        <Button
                                            variant="outline"
                                            className="h-12 w-full text-sm font-semibold sm:hidden"
                                            onClick={handleOpenGPay}
                                        >
                                            <Image src="/google-pay.png" alt="GPay" width={20} height={20} className="mr-2" style={{ objectFit: 'contain' }} />
                                            Google Pay
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 w-full text-sm font-semibold sm:hidden"
                                            onClick={handleOpenPhonePe}
                                        >
                                            <Image src="/phonepe.png" alt="PhonePe" width={20} height={20} className="mr-2" style={{ objectFit: 'contain' }} />
                                            PhonePe
                                        </Button>

                                        <Button
                                            size="lg"
                                            className="w-full h-12 mt-2"
                                            onClick={handleOpenGenericUpi}
                                        >
                                            Open Other UPI App
                                        </Button>

                                        <p className="text-sm text-muted-foreground mt-4 animate-pulse flex items-center justify-center gap-2 col-span-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Waiting for payment confirmation...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
