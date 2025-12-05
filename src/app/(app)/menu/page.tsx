

"use client";

import Link from "next/link";
import Image from "next/image";
import { categories, menuItems } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle
} from "@/components/ui/card";
import { ArrowRight, ShoppingCart, Menu as MenuIcon, LogOut, LayoutDashboard, Search, Heart, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { MenuItem, UserProfile } from "@/lib/types";
import { doc } from "firebase/firestore";
import { useState } from "react";
import { cn } from "@/lib/utils";


function MenuItemGridCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);

  const favorited = isFavorited(item.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.id);
  }

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
          <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/70 hover:bg-card" onClick={handleFavoriteClick}>
            <Heart className={cn("h-4 w-4 text-primary", favorited && "fill-red-500 text-red-500")} />
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


export default function MenuPage() {
  const { totalItems } = useCart();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = async () => {
      if(auth) {
        await signOut(auth);
      }
      router.push('/login');
  }
  
  const displayedItems = menuItems.filter(item => {
    const matchesFilter = 
        activeFilter === 'all'
        || (activeFilter === 'favorites' && favoriteIds.includes(item.id))
        || (activeFilter === item.category);

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <header className="px-2">
        <div className="flex justify-between items-center mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                { user ? (
                    <>
                    <DropdownMenuLabel>{userProfile?.name || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/menu">Menu</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4"/>Admin</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4"/> Logout
                    </DropdownMenuItem>
                    </>
                ) : (
                    <>
                    <DropdownMenuItem asChild>
                        <Link href="/login">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/register">Sign Up</Link>
                    </DropdownMenuItem>
                    </>
                )
                }
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {totalItems}
                    </span>
                )}
                <span className="sr-only">Shopping Cart</span>
                </Button>
            </Link>
        </div>
        <div className="space-y-2 text-left">
            <h1 className="text-3xl font-bold tracking-tight">
                Good Morning, {userProfile?.name || 'Bestie'}!
            </h1>
        </div>
        <div className="relative mt-4">
            <Input 
                placeholder="Search your favorite coffee" 
                className="h-12 pl-10 bg-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </header>
      
      <div className="px-2 overflow-x-auto pb-2">
        <div className="flex gap-2">
            <Button variant={activeFilter === 'all' ? 'default' : 'secondary'} className="rounded-full" onClick={() => setActiveFilter('all')}>All</Button>
            <Button variant={activeFilter === 'favorites' ? 'default' : 'secondary'} className="rounded-full" onClick={() => setActiveFilter('favorites')}>Favorites</Button>
            {categories.map((category) => (
              <Button key={category.id} variant={activeFilter === category.id ? 'default' : 'secondary'} className="rounded-full" onClick={() => setActiveFilter(category.id)}>
                {category.name}
              </Button>
            ))}
        </div>
      </div>

      <main className="flex-grow px-2 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
            {displayedItems.map((item) => (
              <MenuItemGridCard key={item.id} item={item} />
            ))}
        </div>
         {displayedItems.length === 0 && searchQuery && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No items found for &quot;{searchQuery}&quot;.</p>
            </div>
        )}
        {activeFilter === 'favorites' && displayedItems.length === 0 && !searchQuery && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">You haven&apos;t favorited any items yet!</p>
            </div>
        )}
      </main>

    </div>
  );
}
