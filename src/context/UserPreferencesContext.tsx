
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

  // Fetch initial favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user && !user.is_anonymous) {
        setIsPreferencesLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('favorites')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user favorites:", error);
          setFavoriteIds([]);
        } else {
          setFavoriteIds(data?.favorites || []);
        }
        setIsPreferencesLoading(false);
      } else {
        // For anonymous or logged-out users, clear favorites and finish loading
        setFavoriteIds([]);
        setIsPreferencesLoading(false);
      }
    };
    
    // This condition ensures we only fetch when the user loading process is complete.
    if(!isUserLoading) {
        fetchFavorites();
    }
  }, [user, isUserLoading, supabase]);

  const toggleFavorite = async (itemId: string) => {
    if (!user || user.is_anonymous) {
      // For now, we don't support favorites for anonymous users.
      console.log("Favorites are only available for logged-in users.");
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(itemId);
    const newFavorites = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== itemId)
      : [...favoriteIds, itemId];
    
    // Update local state immediately for a responsive UI
    setFavoriteIds(newFavorites);

    const { error } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update favorites:', error);
      // Revert state if DB update fails to keep UI in sync with the database
      setFavoriteIds(favoriteIds);
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
