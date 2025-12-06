
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) {
        setFavoriteIds(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isFavorited = (itemId: string) => {
    return favoriteIds.includes(itemId);
  };

  const toggleFavorite = useCallback((itemId: string) => {
    const isCurrentlyFavorited = favoriteIds.includes(itemId);
    const newFavorites = isCurrentlyFavorited
      ? favoriteIds.filter(id => id !== itemId)
      : [...favoriteIds, itemId];
    
    setFavoriteIds(newFavorites);

    try {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  }, [favoriteIds]);


  const value = {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    isLoading
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
