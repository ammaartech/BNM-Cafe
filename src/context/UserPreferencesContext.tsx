
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSupabase } from "./supabase/provider";
import type { UserProfile } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";

interface UserPreferences {
    favorites: string[];
    cart: any[]; // Define more strictly if possible
}

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  updatePreference: (key: keyof UserPreferences, value: any) => void;
  isPreferencesLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, supabase, isUserLoading } = useSupabase();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  
  const debouncedPreferences = useDebounce(preferences, 500);

  // Fetch initial preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (user && !user.is_anonymous) {
        setIsPreferencesLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('favorites, cart')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user preferences:", error);
        } else {
          setPreferences({
              favorites: data?.favorites || [],
              cart: data?.cart || [],
          });
        }
        setIsPreferencesLoading(false);
      } else {
        // For anonymous users, preferences are not stored in DB
        setPreferences({ favorites: [], cart: [] });
        setIsPreferencesLoading(false);
      }
    };
    if(!isUserLoading) {
        fetchPreferences();
    }
  }, [user, isUserLoading, supabase]);

  // Debounce updates to the database
  useEffect(() => {
      const updateUserPreferences = async () => {
        if (user && !user.is_anonymous && debouncedPreferences) {
            const { error } = await supabase
                .from('users')
                .update({ 
                    favorites: debouncedPreferences.favorites,
                    cart: debouncedPreferences.cart 
                })
                .eq('id', user.id);
            
            if (error) {
                console.error('Failed to update user preferences:', error);
            }
        }
    };
    updateUserPreferences();
  }, [debouncedPreferences, user, supabase]);


  const updatePreference = useCallback((key: keyof UserPreferences, value: any) => {
    setPreferences(prev => (prev ? { ...prev, [key]: value } : { favorites: [], cart: [], [key]: value }));
  }, []);

  const isFavorited = (itemId: string) => {
    return preferences?.favorites.includes(itemId) || false;
  };

  const toggleFavorite = useCallback((itemId: string) => {
    if (!preferences) return;
    const isCurrentlyFavorited = preferences.favorites.includes(itemId);
    const newFavorites = isCurrentlyFavorited
      ? preferences.favorites.filter(id => id !== itemId)
      : [...preferences.favorites, itemId];
    
    updatePreference('favorites', newFavorites);
  }, [preferences, updatePreference]);


  const value = {
    preferences,
    isFavorited,
    toggleFavorite,
    updatePreference,
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
