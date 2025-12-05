
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (userProfile && userProfile.favorites) {
      setFavoriteIds(userProfile.favorites);
    } else {
      setFavoriteIds([]);
    }
  }, [userProfile]);

  const isFavorited = (itemId: string) => {
    return favoriteIds.includes(itemId);
  };

  const toggleFavorite = useCallback(async (itemId: string) => {
    if (!user || !userProfileRef) return;

    const isCurrentlyFavorited = favoriteIds.includes(itemId);
    const oldFavorites = favoriteIds;

    // Optimistically update UI
    const newFavorites = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== itemId)
      : [...favoriteIds, itemId];
    setFavoriteIds(newFavorites);

    // Update Firestore
    try {
      await updateDoc(userProfileRef, {
        favorites: isCurrentlyFavorited ? arrayRemove(itemId) : arrayUnion(itemId)
      });
    } catch (error) {
      console.error("Error updating favorites:", error);
      // Revert UI on error
      setFavoriteIds(oldFavorites);
    }
  }, [favoriteIds, user, userProfileRef]);


  const value = {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    isLoading: isProfileLoading
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
