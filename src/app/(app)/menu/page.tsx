
"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle
} from "@/components/ui/card";
import { LogOut, Search, Plus, X, Minus, Heart, Loader2, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { MenuItem, UserProfile } from "@/lib/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useSupabase } from "@/lib/supabase/provider";
import { Skeleton } from "@/components/ui/skeleton";


function MenuItemGridCard({ item }: { item: MenuItem }) {
  const { addItem, updateQuantity, state, updatingItemId } = useCart();
  const { user } = useSupabase();
  const { favoriteIds, toggleFavorite } = useUserPreferences();
  const isFavorited = favoriteIds.includes(item.id);

  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);

  const cartItem = state.items.find(i => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isUpdating = updatingItemId === item.id;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (user) {
      toggleFavorite(item.id);
    }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col text-left">
      <div className="relative group">
        <Link href={`/menu/${item.category}/${item.id}`} className="block relative">
          <div className="relative aspect-square w-full">
            {itemImage && (
                <Image
                src={itemImage.imageUrl}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={itemImage.imageHint}
                />
            )}
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-card/60 hover:bg-card/80 text-white"
              onClick={handleFavoriteClick}
            >
              <Heart className={cn(
                "h-5 w-5 transition-all duration-200 ease-in-out",
                isFavorited ? "text-red-500 fill-red-500" : "text-white"
              )} />
            </Button>
        </div>
      </div>
      <CardHeader>
        <Link href={`/menu/${item.category}/${item.id}`} className="block">
            <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow flex justify-between items-end">
        <p className="text-lg font-bold text-foreground">₹{item.price.toFixed(2)}</p>
        { isUpdating ? (
            <div className="flex items-center justify-end h-8 w-24">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        ) : quantity === 0 ? (
          <Button size="icon" className="h-8 w-8" onClick={() => addItem(item)} disabled={isUpdating}>
              <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, quantity - 1)} disabled={isUpdating}>
                  <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-4 text-center">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, quantity + 1)} disabled={isUpdating}>
                  <Plus className="h-4 w-4" />
              </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function MenuPage() {
  const { user } = useSupabase();
  const { favoriteIds } = useUserPreferences();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      } else {
        setMenuItems(data as MenuItem[]);
      }
      setIsLoading(false);
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'favorites') {
      setActiveFilter('favorites');
    } else {
      setActiveFilter('all');
    }
  }, [searchParams]);

   useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !user.is_anonymous) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }

  const handleFilterClick = (filter: string) => {
    router.push(`/menu?filter=${filter}`, { scroll: false });
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
    <div className="flex flex-col h-full">
      <header className="px-2 pt-4 pb-4">
        <div className="flex justify-between items-center mb-4">
            { user && !user.is_anonymous ? (
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
                  <LogOut className="h-6 w-6 scale-x-[-1]" />
                  <span className="sr-only">Logout</span>
                </Button>
            ) : (
                <div className="w-10"></div> // Placeholder for spacing
            )}
            <div className="flex justify-center">
                <Image src="/bnmlogoB12.png" alt="B.N.M Cafe Logo" width={140} height={40} priority />
            </div>
            { user && !user.is_anonymous ? (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
                <Link href="/profile">
                  <User className="h-6 w-6" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
            ) : (
                <div className="w-10"></div>
            )}
        </div>
        
        <div className="relative flex items-center h-12">
            <Button variant="ghost" size="icon" className="text-muted-foreground absolute left-0 top-1/2 -translate-y-1/2 z-20" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                {isSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                <span className="sr-only">{isSearchOpen ? 'Close search' : 'Open search'}</span>
            </Button>

            <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out",
                isSearchOpen ? "opacity-0" : "opacity-100"
            )}>
                 <h2 className="text-xl font-bold tracking-tight text-primary">
                    {userProfile?.name ? `Welcome, ${userProfile.name}!` : 'Good Morning, Welcome!'}
                </h2>
            </div>
            
            <div className={cn(
                "absolute inset-0 transition-all duration-300 ease-in-out z-10",
                isSearchOpen ? "opacity-100" : "opacity-0"
            )}>
                 <Input 
                    placeholder="Search your favorite coffee" 
                    className={cn(
                        "h-12 pl-12 bg-input transition-all duration-300 ease-in-out w-full",
                        isSearchOpen ? "opacity-100" : "opacity-0"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!isSearchOpen}
                 />
            </div>
        </div>
      </header>
      
      <div className="overflow-x-auto py-2 no-scrollbar px-2">
        <div className="flex gap-2">
            <Button variant={activeFilter === 'all' ? 'default' : 'secondary'} className="rounded-full whitespace-nowrap" onClick={() => handleFilterClick('all')}>All</Button>
            <Button variant={activeFilter === 'favorites' ? 'default' : 'secondary'} className="rounded-full whitespace-nowrap" onClick={() => handleFilterClick('favorites')}>Favorites</Button>
            {categories.map((category) => (
              <Button key={category.id} variant={activeFilter === category.id ? 'default' : 'secondary'} className="rounded-full whitespace-nowrap" onClick={() => handleFilterClick(category.id)}>
                {category.name}
              </Button>
            ))}
        </div>
      </div>

      <main className="flex-grow px-2 py-4 overflow-y-auto">
        {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <Skeleton className="aspect-square w-full" />
                        <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {displayedItems.map((item) => (
                  <MenuItemGridCard key={item.id} item={item} />
                ))}
            </div>
        )}
         {!isLoading && displayedItems.length === 0 && (
          <div className="text-center py-16">
            {menuItems.length === 0 ? (
               <p className="text-muted-foreground">The menu is empty. The admin needs to add items.</p>
            ) : searchQuery ? (
              <p className="text-muted-foreground">No items found for &quot;{searchQuery}&quot;.</p>
            ) : activeFilter === 'favorites' ? (
              <p className="text-muted-foreground">You haven't favorited any items yet.</p>
            ): (
              <p className="text-muted-foreground">No items in this category.</p>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
