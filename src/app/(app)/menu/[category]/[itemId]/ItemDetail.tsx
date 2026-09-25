"use client";

import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { getItemImage } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Plus, Star, Minus, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useMenuItems } from "@/lib/queries";
import type { MenuItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function ItemDetailSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="relative flex-shrink-0 h-96 w-full" />
             <div className="flex-grow p-6 space-y-4 bg-card rounded-t-3xl -mt-6 z-10 flex flex-col shadow-2xl">
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex-grow"></div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="w-full h-14 rounded-full" />
            </div>
        </div>
    )
}

export default function ItemDetail({ itemId, initialItem }: { itemId: string; initialItem: MenuItem | null }) {
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useUserPreferences();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Usually already cached from the menu page; the server copy covers a direct visit.
  const { data: menuItems } = useMenuItems(initialItem ? [initialItem] : null);
  const item = menuItems?.find((m) => m.id === itemId) ?? initialItem;

  if (!item) {
    // No menu yet: still loading. Menu loaded without this item: it doesn't exist.
    if (!menuItems) return <ItemDetailSkeleton />;
    notFound();
  }

  const isFavorited = favoriteIds.includes(item.uuid);

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
  };
  
  const itemImage = getItemImage(item.image);
  const rating = 4.5;
  const isOutOfStock = item.stock <= 0;

  return (
    <div className="flex flex-col h-full bg-background">
       <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
         <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-card/60 hover:bg-card/90 text-foreground rounded-full">
            <ArrowLeft className="h-6 w-6"/>
        </Button>
        <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 rounded-full bg-card/60 hover:bg-card/80 text-white"
            onClick={() => toggleFavorite(item.uuid)}
          >
            <Heart className={cn(
              "h-6 w-6 transition-all duration-200 ease-in-out",
              isFavorited ? "text-red-500 fill-red-500" : "text-white"
            )} />
          </Button>
       </div>
      <div className="relative flex-shrink-0 h-96">
        {itemImage && (
            <Image
                src={itemImage.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                priority
                className="object-cover"
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
          data-tour="item-add"
        >
          Add to Cart
        </Button>
      </div>

    </div>
  );
}
