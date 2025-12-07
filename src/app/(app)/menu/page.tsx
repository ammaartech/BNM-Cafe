
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
import { LogOut, Search, Plus, X, Minus, Heart } from "lucide-react";
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


function MenuItemGridCard({ item }: { item: MenuItem }) {
  const { addItem, updateQuantity, state } = useCart();
  const { user } = useSupabase();
  const { favoriteIds, toggleFavorite } = useUserPreferences();
  const isFavorited = favoriteIds.includes(item.id);

  const itemImage = PlaceHolderImages.find((img) => img.id === item.image);

  const cartItem = state.items.find(i => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    toggleFavorite(item.id, user);
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col text-left">
       <Link href={`/menu/${item.category}/${item.id}`} className="block relative group">
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
      <CardHeader>
        <Link href={`/menu/${item.category}/${item.id}`} className="block">
            <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow flex justify-between items-end">
        <p className="text-lg font-bold text-foreground">₹{item.price.toFixed(2)}</p>
        {quantity === 0 ? (
          <Button size="icon" className="h-8 w-8" onClick={() => addItem(item)}>
              <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, quantity - 1)}>
                  <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, quantity + 1)}>
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
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setActiveFilter(filterParam);
    } else {
      setActiveFilter('all');
    }
  }, [searchParams]);

   useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error for anon users
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
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
        <div className="flex justify-between items-center mb-2">
            { user && !user.is_anonymous ? (
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
                  <LogOut className="h-6 w-6 scale-x-[-1]" />
                  <span className="sr-only">Logout</span>
                </Button>
            ) : (
                <div className="w-10"></div> // Placeholder for spacing
            )}
            <h1 className="text-3xl font-bold text-center">BNM Cafe</h1>
            <div className="w-10"></div>
        </div>

        <div className="text-center mb-4">
            <h2 className="text-xl font-bold tracking-tight text-primary">
                Good Morning{userProfile?.name ? `, ${userProfile.name}!` : ', Welcome!'}
            </h2>
        </div>
        
        <div className="relative">
            <Button variant="ghost" size="icon" className="text-muted-foreground absolute left-0 top-1/2 -translate-y-1/2" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                {isSearchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                <span className="sr-only">{isSearchOpen ? 'Close search' : 'Open search'}</span>
            </Button>
            <div className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden",
                isSearchOpen ? "max-h-20" : "max-h-0"
            )}>
                <Input 
                    placeholder="Search your favorite coffee" 
                    className="h-12 pl-12 bg-input" // Add padding for the icon
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
        <div className="grid grid-cols-2 gap-4">
            {displayedItems.map((item) => (
              <MenuItemGridCard key={item.id} item={item} />
            ))}
        </div>
         {displayedItems.length === 0 && (
          <div className="text-center py-16">
            {searchQuery ? (
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
