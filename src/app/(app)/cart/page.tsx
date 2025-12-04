"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Minus, Plus, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { state, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <ShoppingCart className="h-24 w-24 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild>
          <Link href="/menu">Start Ordering</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Your Cart ({totalItems} {totalItems > 1 ? 'items' : 'item'})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y">
                {state.items.map((item) => {
                    const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
                    return (
                    <li key={item.id} className="flex items-center gap-4 p-4">
                        {itemImage && (
                        <Image
                            src={itemImage.imageUrl}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="rounded-md object-cover"
                            data-ai-hint={itemImage.imageHint}
                        />
                        )}
                        <div className="flex-grow grid gap-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                             <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} className="w-16 h-8 text-center" />
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive mt-2" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </li>
                    );
                })}
                </ul>
            </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1 sticky top-24">
        <Card>
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Taxes & Fees</span>
                    <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Checkout
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
