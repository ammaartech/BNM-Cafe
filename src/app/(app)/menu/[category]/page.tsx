
import * as React from 'react';
import { categories, menuItems } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                key={i}
                className={`h-4 w-4 ${
                    i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
                />
            ))}
        </div>
    )
}

export default function MenuItemsPage({
  params,
}: {
  params: { category: string };
}) {
  const category = categories.find((c) => c.id === params.category);
  if (!category) {
    notFound();
  }

  const items = menuItems.filter((item) => item.category === params.category);

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/menu">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                {category.name}
                </h1>
                <p className="mt-1 text-muted-foreground">
                Our menu is below
                </p>
            </div>
        </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, index) => {
              const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
              const rating = Math.floor(Math.random() * 3) + 3; // Random rating between 3 and 5

              return (
              <React.Fragment key={item.id}>
                <Link href={`/menu/${category.id}/${item.id}`}>
                    <div className="flex gap-4 py-2">
                        {itemImage && (
                            <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                src={itemImage.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                data-ai-hint={itemImage.imageHint}
                                />
                            </div>
                        )}
                        <div className="flex-grow">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={rating} />
                             </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                </Link>
                {index < items.length - 1 && <Separator />}
              </React.Fragment>
          )})}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground">No items found in this category yet. Please check back later!</p>
        </div>
      )}
    </div>
  );
}

export function generateStaticParams() {
    return categories.map((category) => ({
        category: category.id
    }))
}
