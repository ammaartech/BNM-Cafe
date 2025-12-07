
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function CheckoutSkeleton() {
    return (
      <div className="grid md:grid-cols-3 gap-8">
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
  const { isUserLoading } = useSupabase();
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { state, totalPrice, totalItems, placeOrder } = useCart();
  
  // Prices are inclusive of 5% GST.
  const subTotal = totalPrice / 1.05;
  const taxAmount = totalPrice - subTotal;
  const finalTotal = totalPrice;
  
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    await placeOrder();
    // No need to set isPlacingOrder to false, as the page will redirect.
  }

  const isLoading = isUserLoading;

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (totalItems === 0 && !isPlacingOrder) {
    return (
        <div className="flex-grow flex items-center justify-center">
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
     <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/cart">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
        <div className="flex-grow space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Items in Order ({totalItems})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y">
                        {state.items.map(item => {
                            const itemImage = PlaceHolderImages.find(img => img.id === item.image);
                            return (
                                <li key={item.id} className="flex items-center gap-4 p-4">
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
        </div>
        
        <div className="mt-auto pt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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

            <div className="flex items-center gap-2">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-14 w-1/2 text-base font-bold">
                            <QrCode className="mr-2 h-5 w-5" />
                            Pay by QR
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs p-4">
                        <DialogHeader>
                            <DialogTitle className="text-center">Scan & Pay</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                            <Image src="/qrcode1.png" alt="Payment QR Code" width={250} height={250} />
                        </div>
                    </DialogContent>
                </Dialog>

                <Button className="w-1/2 h-14 text-lg font-bold" size="lg" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                  {isPlacingOrder ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                  {isPlacingOrder ? 'Placing Order...' : `Pay ₹${finalTotal.toFixed(2)}`}
                </Button>
            </div>
        </div>
    </div>
  );
}
