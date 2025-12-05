"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function MenuCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
            Order Now
            </h1>
            <p className="text-muted-foreground">
            Our menu is below
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const categoryImage = PlaceHolderImages.find(
            (img) => img.id === category.image
          );
          return (
            <Link
              href={`/menu/${category.id}`}
              key={category.id}
              className="group"
            >
              <Card className="overflow-hidden h-full flex items-center transition-all duration-300 hover:shadow-md hover:border-primary/50">
                {categoryImage && (
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                      src={categoryImage.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      data-ai-hint={categoryImage.imageHint}
                    />
                  </div>
                )}
                <CardHeader className="flex-grow">
                    <CardTitle className="font-semibold text-lg">
                      {category.name}
                    </CardTitle>
                  <CardDescription className="text-sm">{category.description}</CardDescription>
                </CardHeader>
                <div className="p-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
