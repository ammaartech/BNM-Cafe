
"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowLeft, Trash2, Asterisk, Minus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { state, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const router = useRouter();
  
  const subTotal = totalPrice / 1.05;
  const taxAmount = totalPrice - subTotal;
  const finalTotal = totalPrice;

  const handleCheckout = () => {
    router.push('/checkout');
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/menu">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-2xl font-bold">My Cart</h1>
        </div>
        
        {totalItems === 0 ? (
             <div className="flex-grow flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground mb-6">Your cart is empty.</p>
                <Button asChild>
                <Link href="/menu">Start Ordering</Link>
                </Button>
            </div>
        ) : (
            <>
            <div className="flex-grow space-y-4 pt-6">
                {state.items.map((item) => {
                    const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
                    return (
                        <Card key={item.id} className="flex items-center p-3 gap-3 shadow-sm">
                            {itemImage && 
                                <div className="relative h-20 w-20 rounded-md overflow-hidden">
                                <Image
                                    src={itemImage.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={itemImage.imageHint}
                                />
                                </div>
                            }
                            <div className="flex-grow grid gap-1">
                                <p className="font-semibold text-lg">{item.name}</p>
                                <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-3">
                                        <Button variant="outline" size="icon" className="w-8 h-8 rounded-full" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="text-lg font-bold w-4 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="w-8 h-8 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                            <Asterisk className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive -mr-2" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xl font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </Card>
                    )
                })}
            </div>
            
            <div className="mt-auto pt-6">
                 <Card className="mb-6">
                    <CardContent className="p-4 space-y-3">
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
                <Button className="w-full h-14 text-lg font-bold" onClick={handleCheckout}>
                    Checkout
                </Button>
            </div>
        </>
        )}
    </div>
  );
}
