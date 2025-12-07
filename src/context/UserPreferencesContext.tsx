
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemId: string, user: User | null) => void;
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
    if (!user || user.is_anonymous || !supabase) {
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
  }, [user, supabase, toast]);


  useEffect(() => {
    if (!isUserLoading) {
      fetchFavorites();
    }
  }, [isUserLoading, user, fetchFavorites]);

  const toggleFavorite = async (menuItemId: string, user: User | null) => {
    if (!user || user.is_anonymous || !supabase) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
        variant: 'destructive',
      });
      router.push('/'); 
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(menuItemId);
    const originalFavorites = [...favoriteIds];

    // Optimistic UI update
    if (isCurrentlyFavorited) {
      setFavoriteIds(prev => prev.filter(id => id !== menuItemId));
    } else {
      setFavoriteIds(prev => [...prev, menuItemId]);
    }

    if (isCurrentlyFavorited) {
      // --- REMOVE FAVORITE ---
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_id: menuItemId });

      if (error) {
        toast({ title: 'Error', description: 'Could not remove from favorites.', variant: 'destructive'});
        setFavoriteIds(originalFavorites); // Revert UI on failure
      }
    } else {
      // --- ADD FAVORITE ---
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_id: menuItemId });
        
      if (error) {
        toast({ title: 'Error', description: 'Could not add to favorites.', variant: 'destructive'});
        setFavoriteIds(originalFavorites); // Revert UI on failure
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
