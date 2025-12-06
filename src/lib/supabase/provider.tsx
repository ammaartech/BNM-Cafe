
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserProfile['role'] | null;
  isUserLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserProfile['role'] | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const getSessionAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setUserProfile(profile);
        setUserRole(profile?.role || 'customer');
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
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          setUserProfile(profile);
          setUserRole(profile?.role || 'customer');
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
  }, []);

  const value = {
    supabase,
    user,
    userProfile,
    userRole,
    isUserLoading,
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
