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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">
          Our Menu
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore our delicious offerings, crafted with love.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1">
                {categoryImage && (
                  <div className="relative h-48 w-full">
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
                  <div className="flex items-center gap-3 mb-2">
                    <category.icon className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline text-xl">
                      {category.name}
                    </CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                    <div className="flex items-center text-sm font-semibold text-primary group-hover:underline">
                        View Items <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
