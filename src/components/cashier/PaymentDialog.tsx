"use client";

import { useState, useEffect, useCallback } from "react";
import { UPIQR } from "@adityavijay21/upiqr";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle2,
    Loader2,
    RefreshCw,
    Smartphone,
    QrCode,
} from "lucide-react";
import { useCashier } from "@/context/CashierContext";
import { cn } from "@/lib/utils";

import { useSupabase } from "@/lib/supabase/provider";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "BNM Cafe";

interface PaymentDialogProps {
    orderId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentConfirmed: () => Promise<void>;
}

type PaymentStatus = "awaiting" | "confirming" | "confirmed";

export function PaymentDialog({ orderId, open, onOpenChange, onPaymentConfirmed }: PaymentDialogProps) {
    const { totalPrice, state } = useCashier();
    const { supabase } = useSupabase();

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [upiIntent, setUpiIntent] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("awaiting");

    const orderNote = state.customerName.trim()
        ? `BNM Cafe - ${state.customerName.trim()}`
        : "BNM Cafe Order";

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
                    transactionNote: orderNote,
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
    }, [totalPrice, orderNote, orderId]);

    // Generate QR whenever dialog opens
    useEffect(() => {
        if (open && paymentStatus === "awaiting") {
            generateQR();
        }
    }, [open, generateQR, paymentStatus]);

    // Listen to Supabase Realtime for Webhook Updates
    useEffect(() => {
        if (!open || !orderId || !supabase) return;

        const channel = supabase
            .channel(`order-payment-${orderId}`)
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
                        onPaymentConfirmed(); // Trigger clear bill and closing
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

    const handleConfirmPayment = async () => {
        if (!supabase || !orderId) return;
        setPaymentStatus("confirming");
        try {
            // Manual override: Server updates it, which triggers the realtime event above
            // Or we just call onPaymentConfirmed directly if we want it to be instant
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: 'PAID' })
                .eq('id', orderId);

            if (error) throw error;

            setPaymentStatus("confirmed");
            await onPaymentConfirmed();

            // Auto-close after 2.5s
            setTimeout(() => {
                onOpenChange(false);
            }, 2500);
        } catch (err) {
            console.error("Failed to confirm payment:", err);
            setPaymentStatus("awaiting");
        }
    };

    const handleOpenUPIApp = () => {
        if (upiIntent) {
            window.location.href = upiIntent;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm w-full p-0 overflow-hidden">
                {/* --- SUCCESS STATE --- */}
                {paymentStatus === "confirmed" && (
                    <div className="flex flex-col items-center justify-center p-10 space-y-4 text-center">
                        <CheckCircle2 className="h-20 w-20 text-green-500 animate-in zoom-in-50 duration-300" />
                        <DialogTitle className="text-2xl font-bold">Payment Confirmed!</DialogTitle>
                        <p className="text-muted-foreground">Order has been placed successfully.</p>
                    </div>
                )}

                {/* --- AWAITING / CONFIRMING STATE --- */}
                {paymentStatus !== "confirmed" && (
                    <>
                        {/* Header */}
                        <DialogHeader className="p-5 pb-3">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <QrCode className="h-5 w-5" />
                                    Scan & Pay
                                </DialogTitle>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold text-primary">₹{totalPrice.toFixed(2)}</p>
                                </div>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground pt-1">
                                UPI ID: <span className="font-mono font-semibold text-foreground">{UPI_ID}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <Separator />

                        {/* QR Code Area */}
                        <div className="flex flex-col items-center justify-center p-6 space-y-4">
                            <div className={cn(
                                "w-64 h-64 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 transition-all",
                                qrDataUrl && "border-primary/30 bg-white p-2"
                            )}>
                                {isGenerating && (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Loader2 className="h-10 w-10 animate-spin" />
                                        <p className="text-sm">Generating QR...</p>
                                    </div>
                                )}
                                {!isGenerating && qrDataUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={qrDataUrl}
                                        alt="UPI Payment QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                                {!isGenerating && !qrDataUrl && (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <QrCode className="h-10 w-10" />
                                        <p className="text-sm">QR code failed to load</p>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Scan with any UPI app · <span className="font-medium">{orderNote}</span>
                            </p>

                            {/* Regen button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateQR}
                                disabled={isGenerating}
                                className="text-xs text-muted-foreground h-7"
                            >
                                <RefreshCw className={cn("h-3 w-3 mr-1", isGenerating && "animate-spin")} />
                                Regenerate
                            </Button>
                        </div>

                        <Separator />

                        {/* Action buttons */}
                        <div className="p-4 space-y-2">
                            {/* Deep link — opens GPay/PhonePe if on mobile */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleOpenUPIApp}
                                disabled={!upiIntent}
                            >
                                <Smartphone className="mr-2 h-4 w-4" />
                                Open UPI App
                            </Button>

                            {/* Manual confirm */}
                            <Button
                                className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleConfirmPayment}
                                disabled={paymentStatus === "confirming"}
                            >
                                {paymentStatus === "confirming" ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                )}
                                {paymentStatus === "confirming" ? "Placing Order..." : "Payment Received ✓"}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground pt-1">
                                Press after customer confirms payment on their phone
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
