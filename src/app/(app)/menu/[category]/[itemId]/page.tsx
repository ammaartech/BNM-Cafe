
"use client";

import { menuItems } from "@/lib/data";
import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Plus, Star, Minus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function MenuItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  const { category: categoryId, itemId } = params;

  const item = menuItems.find((item) => item.id === itemId && item.category === categoryId);

  if (!item) {
    notFound();
  }

  const handleAddToCart = () => {
    for(let i = 0; i < quantity; i++) {
        addItem(item);
    }
  };
  
  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
  const rating = 4.5;
  const isOutOfStock = item.stock <= 0;

  return (
    <div className="flex flex-col h-full bg-background">
       <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
         <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-card/60 hover:bg-card/90 text-foreground rounded-full">
            <ArrowLeft className="h-6 w-6"/>
        </Button>
       </div>
      <div className="relative flex-shrink-0 h-96">
        {itemImage && (
            <Image
                src={itemImage.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                data-ai-hint={itemImage.imageHint}
            />
        )}
      </div>

      <div className="flex-grow p-6 space-y-4 bg-card rounded-t-3xl -mt-6 z-10 flex flex-col shadow-2xl">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold">{item.name}</h1>
                <p className="text-muted-foreground mt-2">{item.description}</p>
            </div>
            <div className="flex items-center gap-1 bg-muted text-foreground px-2 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-sm">{rating}</span>
            </div>
        </div>

        <div className="flex-grow"></div>

        <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                    <Minus className="h-5 w-5" />
                </Button>
                <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setQuantity(q => q + 1)}>
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-3xl font-bold text-foreground">₹{(item.price * quantity).toFixed(2)}</p>
        </div>


        <Button
          className="w-full h-14 text-lg font-bold rounded-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          Add to Cart
        </Button>
      </div>

    </div>
  );
}
