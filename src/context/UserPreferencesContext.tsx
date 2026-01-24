
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemUuid: string) => void;
  isLoading: boolean;
  fetchFavorites: (userId: string) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async (currentUserId: string) => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_favorites')
      .select('menu_item_uuid')
      .eq('user_id', currentUserId);

    if (error) {
      console.error("Error fetching user favorites:", error);
      toast({ title: 'Error', description: 'Could not load your favorites.', variant: 'destructive'});
      setFavoriteIds([]);
    } else {
      setFavoriteIds(data?.map(fav => fav.menu_item_uuid) || []);
    }
    setIsLoading(false);
  }, [supabase, toast]);


  useEffect(() => {
    if (!isUserLoading && user) {
      fetchFavorites(user.id);
    } else if (!isUserLoading && !user) {
        setFavoriteIds([]);
        setIsLoading(false);
    }
  }, [isUserLoading, user, fetchFavorites]);

  const toggleFavorite = useCallback(async (menuItemUuid: string) => {
    if (!user || !supabase) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
        variant: 'destructive',
      });
      router.push('/');
      return;
    }

    if (user.is_anonymous) {
        toast({
            title: 'Account Required',
            description: 'Please create an account to save your favorites.',
            variant: 'destructive',
        });
        router.push('/');
        return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(menuItemUuid);
    
    // Optimistic UI update
    setFavoriteIds(prev => 
        isCurrentlyFavorited 
            ? prev.filter(id => id !== menuItemUuid) 
            : [...prev, menuItemUuid]
    );
    
    let error;
    if (isCurrentlyFavorited) {
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_uuid: menuItemUuid });
        error = deleteError;
    } else {
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_uuid: menuItemUuid });
        error = insertError;
    }

    if (error) {
        const action = isCurrentlyFavorited ? 'remove from' : 'add to';
        toast({ 
            title: 'Error', 
            description: `Could not ${action} favorites. Details: ${error.message}`, 
            variant: 'destructive'
        });
        // Revert UI on failure
        setFavoriteIds(prev => 
            isCurrentlyFavorited 
                ? [...prev, menuItemUuid]
                : prev.filter(id => id !== menuItemUuid)
        );
    }
  }, [user, supabase, toast, router, favoriteIds]);

  const value = {
    favoriteIds,
    toggleFavorite,
    isLoading: isLoading || isUserLoading,
    fetchFavorites,
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
