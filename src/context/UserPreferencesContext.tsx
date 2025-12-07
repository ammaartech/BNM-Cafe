
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemId: string) => void;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user || !supabase) {
      setFavoriteIds([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_favorites')
      .select('menu_item_id')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching user favorites:", error);
      toast({ title: 'Error', description: 'Could not load your favorites.', variant: 'destructive'});
      setFavoriteIds([]);
    } else {
      setFavoriteIds(data.map(fav => fav.menu_item_id) || []);
    }
    setIsLoading(false);
  }, [user, supabase]);


  useEffect(() => {
    if (!isUserLoading) {
      fetchFavorites();
    }
  }, [isUserLoading, user, fetchFavorites]);

  const toggleFavorite = async (menuItemId: string) => {
    if (!user || !supabase) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
        variant: 'destructive',
      });
      router.push('/');
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(menuItemId);
    
    if (isCurrentlyFavorited) {
      // --- REMOVE FAVORITE ---
      setFavoriteIds(prev => prev.filter(id => id !== menuItemId)); // Optimistic update
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_id: menuItemId });

      if (error) {
        toast({ title: 'Error', description: 'Could not remove from favorites.', variant: 'destructive'});
        setFavoriteIds(prev => [...prev, menuItemId]); // Revert UI on failure
      }
    } else {
      // --- ADD FAVORITE ---
      setFavoriteIds(prev => [...prev, menuItemId]); // Optimistic update
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_id: menuItemId });
        
      if (error) {
        toast({ title: 'Error', description: 'Could not add to favorites.', variant: 'destructive'});
        setFavoriteIds(prev => prev.filter(id => id !== menuItemId)); // Revert UI on failure
      }
    }
  };

  const value = {
    favoriteIds,
    toggleFavorite,
    isLoading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
