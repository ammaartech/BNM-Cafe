
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserProfile['role'] | null;
  isUserLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserProfile['role'] | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profile) {
      setUserProfile(profile);
      setUserRole(profile.role || 'customer');
    }
  }, []);
  
  const refreshUserProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
        await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const getSessionAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        // Handle anonymous user sign in
         const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
         if (anonError) {
             console.error("Error signing in anonymously:", anonError);
         } else {
             setUser(anonData.user);
             setUserProfile(null); // Anonymous users don't have a profile
             setUserRole('customer'); // Default role for anonymous users
         }
      }
      
      setIsUserLoading(false);
    };

    getSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsUserLoading(true);
        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          setUserProfile(null);
          setUserRole(null);
        }
        setIsUserLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value = {
    supabase,
    user,
    userProfile,
    userRole,
    isUserLoading,
    refreshUserProfile,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
