
"use client";

import { menuItems } from "@/lib/data";
import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, PlusCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}


export default function MenuItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  
  const { category: categoryId, itemId } = params;

  const item = menuItems.find((item) => item.id === itemId && item.category === categoryId);

  if (!item) {
    notFound();
  }

  const handleAddToCart = () => {
    addItem(item);
    setTimeout(() => {
        router.push('/menu');
    }, 1000); // Wait for the toast to show
  };

  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
  const rating = 4; // Static rating for now
  const isOutOfStock = item.stock <= 0;

  return (
    <div className="flex flex-col h-full animate-fade-in-slide-up">
      <div className="relative">
        {itemImage && (
            <div className="relative h-64 w-full">
                <Image
                    src={itemImage.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    data-ai-hint={itemImage.imageHint}
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
        )}
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 bg-background/50 hover:bg-background/80" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6"/>
        </Button>
         {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
            </div>
        )}
      </div>

      <div className="flex-grow p-6 space-y-4 bg-card rounded-t-2xl -mt-6 z-10">
        <h1 className="text-3xl font-bold">{item.name}</h1>
        <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-primary">${item.price.toFixed(2)}</p>
            <StarRating rating={rating} />
        </div>
        <p className="text-muted-foreground pt-4">{item.description}</p>
      </div>

      <div className="mt-auto p-6 bg-card">
        <Button
          className="w-full h-14 text-lg font-bold"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <PlusCircle className="mr-2 h-6 w-6" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
