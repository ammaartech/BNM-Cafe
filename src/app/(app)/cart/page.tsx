
"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { state, removeItem, totalPrice, totalItems } = useCart();
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
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
            <div className="flex-grow space-y-4">
                {state.items.map((item) => {
                    const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
                    return (
                        <Card key={item.id} className="flex items-center p-3 gap-3 shadow-sm">
                            {itemImage && 
                                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                <Image
                                    src={itemImage.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={itemImage.imageHint}
                                />
                                </div>
                            }
                            <div className="flex-grow">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-primary font-bold">₹{item.price.toFixed(2)}</p>
                            </div>
                            <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </Card>
                    )
                })}
            </div>
            
            <div className="mt-auto pt-6">
                 <Card className="mb-6">
                    <CardContent className="p-4 space-y-3">
                         <div className="flex justify-between text-muted-foreground">
                            <span>Items ({totalItems})</span>
                            <span>₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Delivery fee</span>
                            <span>₹0.00</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{totalPrice.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg font-bold" asChild>
                    <Link href="/checkout">
                       Checkout
                    </Link>
                </Button>
            </div>
        </>
        )}
    </div>
  );
}
