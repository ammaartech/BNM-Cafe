"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface UserPreferencesContextType {
  favoriteIds: string[];
  toggleFavorite: (menuItemUuid: string) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const EMPTY: string[] = [];

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  const { data: favoriteIds = EMPTY, mutate } = useSWR(
    user && !user.is_anonymous ? (['favorites', user.id] as const) : null,
    async ([, userId]) => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('menu_item_uuid')
        .eq('user_id', userId);
      if (error) throw error;
      return data?.map(fav => fav.menu_item_uuid as string) ?? [];
    },
    { onError: (err) => console.error("Error fetching user favorites:", err) }
  );

  const toggleFavorite = useCallback(async (menuItemUuid: string) => {
    if (!user || user.is_anonymous) {
      toast({
        title: 'Please log in',
        description: 'You need an account to save favorites.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(menuItemUuid);
    const next = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== menuItemUuid)
      : [...favoriteIds, menuItemUuid];

    try {
      await mutate(
        async () => {
          const { error } = isCurrentlyFavorited
            ? await supabase.from('user_favorites').delete().match({ user_id: user.id, menu_item_uuid: menuItemUuid })
            : await supabase.from('user_favorites').insert({ user_id: user.id, menu_item_uuid: menuItemUuid });
          if (error) throw error;
          return next;
        },
        { optimisticData: next, rollbackOnError: true, revalidate: false }
      );
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Could not ${isCurrentlyFavorited ? 'remove from' : 'add to'} favorites. ${err?.message ?? ''}`,
        variant: 'destructive'
      });
    }
  }, [user, supabase, toast, router, favoriteIds, mutate]);

  const value = useMemo(() => ({ favoriteIds, toggleFavorite }), [favoriteIds, toggleFavorite]);

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
