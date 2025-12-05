
'use client';

import { useFavorites } from '@/context/FavoritesContext';
import { menuItems } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, Heart, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

function FavoriteItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);

  const favorited = isFavorited(item.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col text-left">
      <Link href={`/menu/${item.category}/${item.id}`} className="block">
        <div className="relative aspect-square w-full">
          {itemImage && (
            <Image
              src={itemImage.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              data-ai-hint={itemImage.imageHint}
            />
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/70 hover:bg-card"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn('h-4 w-4 text-primary', favorited && 'fill-red-500 text-red-500')} />
          </Button>
        </div>
      </Link>
      <CardHeader>
        <Link href={`/menu/${item.category}/${item.id}`} className="block">
          <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow flex justify-between items-end">
        <p className="text-lg font-bold text-foreground">₹{item.price.toFixed(2)}</p>
        <Button size="icon" className="h-8 w-8" onClick={() => addItem(item)}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function FavoritesSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <Skeleton className="aspect-square w-full" />
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function FavoritesPage() {
  const { favoriteIds, isLoading } = useFavorites();
  const router = useRouter();

  const favoriteItems = menuItems.filter((item) => favoriteIds.includes(item.id));

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold">My Favorites</h1>
        </div>

      {isLoading ? (
        <FavoritesSkeleton />
      ) : favoriteItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {favoriteItems.map((item) => (
            <FavoriteItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-semibold">No Favorites Yet</p>
            <p className="text-sm text-muted-foreground mt-2">Tap the heart on any item to save it here.</p>
            <Button asChild className="mt-6">
                <Link href="/menu">Browse Menu</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
