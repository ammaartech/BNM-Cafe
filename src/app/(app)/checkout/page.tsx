
"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CreditCard, Loader2, ArrowLeft, QrCode } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import Script from "next/script";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

function CheckoutSkeleton() {
    return (
        <div className="grid md:grid-cols-3 gap-8 p-4">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                        <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
                        <Separator />
                        <div className="flex justify-between"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    const { userProfile, user } = useSupabase();
    const { isUserLoading } = useSupabase();
    const router = useRouter();
    const { toast } = useToast();
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const { state, totalPrice, totalItems, placeOrder } = useCart();
    const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COUNTER" | null>(null);

    // Prices are inclusive of 5% GST.
    const subTotal = totalPrice / 1.05;
    const taxAmount = totalPrice - subTotal;
    const finalTotal = totalPrice;

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        setPaymentMethod("RAZORPAY");

        try {
            // 1. Create order in our backend with PENDING status.
            // TRUE flag prevents navigation so we can handle Razorpay flow here.
            const orderId = await placeOrder('PENDING', true);

            if (!orderId) {
                throw new Error("Could not create order");
            }

            // 2. Create Razorpay order linking to our internal order
            const res = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: finalTotal, receipt: orderId }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create order");

            // 3. Open Razorpay checkout modal using callback_url instead of JS handler
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: "INR",
                name: "BNM Cafe",
                description: "Order Payment",
                order_id: data.order.id,
                callback_url: `${window.location.origin}/api/razorpay/verify`,
                redirect: true,
                prefill: {
                    name: userProfile?.name || user?.email || "Guest",
                    email: user?.email || "",
                },
                theme: {
                    color: "#000000",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                setIsPlacingOrder(false);
                setPaymentMethod(null);
                toast({
                    title: "Payment Failed",
                    description: response.error.description,
                    variant: "destructive",
                });
                // If they fail, they are stuck on checkout with empty cart.
                // Redirect them to their pending order so they can review or pay.
                router.push(`/orders/${orderId}`);
            });
            rzp.open();
        } catch (error: any) {
            console.error(error);
            setIsPlacingOrder(false);
            setPaymentMethod(null);
            toast({
                title: "Payment Initialization Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handlePayAtCounter = async () => {
        setIsPlacingOrder(true);
        setPaymentMethod("COUNTER");
        try {
            await placeOrder('PENDING');
        } catch (err: any) {
            toast({ title: "Order Placement Failed", description: err.message, variant: "destructive" });
            setIsPlacingOrder(false);
            setPaymentMethod(null);
        }
    };

    const isLoading = isUserLoading;

    if (isLoading) {
        return <CheckoutSkeleton />;
    }

    if (totalItems === 0 && !isPlacingOrder) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your cart is empty</AlertTitle>
                    <AlertDescription>
                        Please add items from the menu to proceed to checkout.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full p-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/cart">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Checkout</h1>
            </div>

            <motion.div
                className="flex flex-col flex-grow"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                <motion.div
                    className="flex-grow space-y-4 pt-2"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Items in Order ({totalItems})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {state.items.map(item => {
                                    const itemImage = PlaceHolderImages.find(img => img.id === item.image);
                                    return (
                                        <li key={item.id} className="flex items-center gap-4 p-6">
                                            {itemImage && (
                                                <Image
                                                    src={itemImage.imageUrl}
                                                    alt={item.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-md object-cover"
                                                />
                                            )}
                                            <div className="flex-grow grid gap-1">
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                            </div>
                                            <div className="text-right font-semibold">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    className="mt-auto pt-4 space-y-4"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>₹{subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Taxes (GST 5%)</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Button
                            className="w-full sm:w-1/2 h-14 text-lg font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                            onClick={handlePayAtCounter}
                            disabled={isPlacingOrder}
                        >
                            {isPlacingOrder && paymentMethod === "COUNTER" ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Clock className="mr-2 h-6 w-6" />}
                            {isPlacingOrder && paymentMethod === "COUNTER" ? 'Processing...' : `Pay at Counter`}
                        </Button>

                        <Button
                            className="w-full sm:w-1/2 h-14 text-lg font-bold"
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder}
                        >
                            {isPlacingOrder && paymentMethod === "RAZORPAY" ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CreditCard className="mr-2 h-6 w-6" />}
                            {isPlacingOrder && paymentMethod === "RAZORPAY" ? 'Processing...' : `Pay online ₹${finalTotal.toFixed(2)}`}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
