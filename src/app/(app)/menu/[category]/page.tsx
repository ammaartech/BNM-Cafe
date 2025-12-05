
import * as React from 'react';
import { categories, menuItems } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

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
       <div className="flex items-center justify-between gap-4 mb-6 px-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/menu">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
            </Button>
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                {category.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                Our menu is below
                </p>
            </div>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/cart">
                    <ShoppingCart className="h-6 w-6" />
                </Link>
            </Button>
        </div>

      {items.length > 0 ? (
        <div className="space-y-4 px-4">
          {items.map((item) => {
              const itemImage = PlaceHolderImages.find((img) => img.id === item.image);

              return (
              <Link href={`/menu/${category.id}/${item.id}`} key={item.id}>
                <Card className="p-3">
                    <div className="flex items-center gap-4">
                        {itemImage && (
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
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
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-muted-foreground">₹{item.price.toFixed(2)}</p>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </Card>
              </Link>
          )})}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
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
