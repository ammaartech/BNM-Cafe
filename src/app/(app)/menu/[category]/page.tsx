import { categories, menuItems } from "@/lib/data";
import { notFound } from "next/navigation";
import MenuItemCard from "@/components/MenuItemCard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
    <div className="space-y-8">
       <Link href="/menu" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Categories
      </Link>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">
          {category.name}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {category.description}
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
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
