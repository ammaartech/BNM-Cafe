
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemId: string) => void;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user || !supabase) {
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
      setFavoriteIds([]);
    } else {
      setFavoriteIds(data.map(fav => fav.menu_item_id) || []);
    }
    setIsLoading(false);
  }, [user, supabase]);


  useEffect(() => {
    if (!isUserLoading && user) {
      fetchFavorites();
    } else if (!isUserLoading && !user) {
      setFavoriteIds([]);
      setIsLoading(false);
    }
  }, [user, isUserLoading, fetchFavorites]);

  const toggleFavorite = async (menuItemId: string) => {
    if (!user || !supabase) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
        variant: 'destructive',
      });
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(menuItemId);
    
    // Optimistic UI update
    setFavoriteIds(prev => 
        isCurrentlyFavorited 
        ? prev.filter(id => id !== menuItemId)
        : [...prev, menuItemId]
    );

    if (isCurrentlyFavorited) {
      // --- REMOVE FAVORITE ---
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_id: menuItemId });

      if (error) {
        toast({ title: 'Error', description: 'Could not remove from favorites.', variant: 'destructive'});
        // Revert UI change
        setFavoriteIds(prev => [...prev, menuItemId]);
      }
    } else {
      // --- ADD FAVORITE ---
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_id: menuItemId });
        
      if (error) {
        toast({ title: 'Error', description: 'Could not add to favorites.', variant: 'destructive'});
        // Revert UI change
        setFavoriteIds(prev => prev.filter(id => id !== menuItemId));
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
