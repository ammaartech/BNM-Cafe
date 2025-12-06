"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import type { MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "./ui/badge";
import { PlusCircle, ShoppingCart } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem } = useCart();
  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);
  const isOutOfStock = item.stock <= 0;

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-lg">
      <div className="relative h-48 w-full">
        {itemImage && (
          <Image
            src={itemImage.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            data-ai-hint={itemImage.imageHint}
          />
        )}
        {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
            </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-2xl font-bold text-primary">
          ₹{item.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => addItem(item)}
          disabled={isOutOfStock}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
