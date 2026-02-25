
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemUuid: string) => Promise<void>;
  isLoading: boolean;
  fetchFavorites: (userId: string, background?: boolean) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const fetcher = async ([_, currentUserId]: [string, string]) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('user_favorites')
      .select('menu_item_uuid')
      .eq('user_id', currentUserId);

    if (error) throw error;
    return data?.map(fav => fav.menu_item_uuid) || [];
  };

  const { data: favoriteIds, error, isLoading: swrIsLoading, mutate } = useSWR(
    user && !isUserLoading ? ['favorites', user.id] : null,
    fetcher,
    {
      revalidateOnFocus: true,
      onError: (err) => {
        console.error("Error fetching user favorites:", err);
      }
    }
  );

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

    const currentFavorites = favoriteIds || [];
    const isCurrentlyFavorited = currentFavorites.includes(menuItemUuid);

    const newFavorites = isCurrentlyFavorited
      ? currentFavorites.filter(id => id !== menuItemUuid)
      : [...currentFavorites, menuItemUuid];

    // Optimistic UI update via SWR mutate
    mutate(newFavorites, false);

    let opError;
    if (isCurrentlyFavorited) {
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_uuid: menuItemUuid });
      opError = deleteError;
    } else {
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_uuid: menuItemUuid });
      opError = insertError;
    }

    if (opError) {
      const action = isCurrentlyFavorited ? 'remove from' : 'add to';
      toast({
        title: 'Error',
        description: `Could not ${action} favorites. Details: ${opError.message}`,
        variant: 'destructive'
      });
      // Revert UI on failure
      mutate();
    } else {
      mutate(); // Trigger revalidation on success to ensure parity
    }
  }, [user, supabase, toast, router, favoriteIds, mutate]);

  // Maintain backward compatibility for components manually calling fetchFavorites
  const fetchFavorites = useCallback(async (currentUserId: string, background = false) => {
    if (user && user.id === currentUserId) {
      await mutate();
    }
  }, [user, mutate]);

  const value = {
    favoriteIds: favoriteIds || [],
    toggleFavorite,
    isLoading: isUserLoading || (user ? swrIsLoading : false),
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
