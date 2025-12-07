
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import type { UserProfile } from "@/lib/types";

interface UserPreferencesContextType {
  favoriteIds: string[];
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  isPreferencesLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);

  // Fetch favorites when user loading is complete
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user && !user.is_anonymous) {
        setIsPreferencesLoading(true);
        const { data, error } = await supabase
          .from('user_favorites')
          .select('menu_item_id')
          .eq('user_id', user.id);

        if (error) {
            // This case is for potential network or db errors
            setFavoriteIds([]);
        } else {
          setFavoriteIds(data ? data.map(fav => fav.menu_item_id) : []);
        }
        setIsPreferencesLoading(false);
      } else {
        // For anonymous or logged-out users, clear favorites.
        setFavoriteIds([]);
        setIsPreferencesLoading(false);
      }
    };
    
    // Only run fetchFavorites when the user loading state is definitively finished.
    if(!isUserLoading) {
        fetchFavorites();
    }
  }, [user, isUserLoading, supabase]);

  const toggleFavorite = async (itemId: string) => {
    if (!user || user.is_anonymous || !supabase) {
      // Favorites are only for logged-in users.
      // Optionally, show a toast message here to prompt login.
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(itemId);
    let previousFavorites = [...favoriteIds];

    // Optimistically update the UI
    if (isCurrentlyFavorited) {
        setFavoriteIds(favoriteIds.filter(id => id !== itemId));
    } else {
        setFavoriteIds([...favoriteIds, itemId]);
    }

    // Persist the change to the database
    if (isCurrentlyFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .match({ user_id: user.id, menu_item_id: itemId });

      if (error) {
        // Revert UI on error
        setFavoriteIds(previousFavorites);
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, menu_item_id: itemId });

      if (error) {
        // Revert UI on error
        setFavoriteIds(previousFavorites);
      }
    }
  };
  
  const isFavorited = (itemId: string) => {
    return favoriteIds.includes(itemId);
  };

  const value = {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    isPreferencesLoading,
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
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
};
