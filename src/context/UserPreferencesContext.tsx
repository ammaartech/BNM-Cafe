
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
          .from('users')
          .select('favorites')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: "not found"
            // This case is for potential network or db errors, not for "no user"
        } else {
          setFavoriteIds(data?.favorites || []);
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
    if (!user || user.is_anonymous) {
      // Favorites are only for logged-in users.
      // A toast message could be added here in the future.
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(itemId);
    
    // Optimistically update the UI
    const newFavorites = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== itemId)
      : [...favoriteIds, itemId];
    setFavoriteIds(newFavorites);

    // Persist the change to the database
    const { error } = await supabase
      .from('users')
      .update({ favorites: newFavorites })
      .eq('id', user.id);

    if (error) {
      // If the database update fails, revert the UI to the previous state
      setFavoriteIds(favoriteIds);
      // A toast message for the error could be useful here.
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
