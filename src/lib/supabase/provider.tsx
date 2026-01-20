
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Start as true
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    if (currentUser.is_anonymous) {
      setUserProfile(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } else {
      setUserProfile(profile || null);
    }
  }, []);
  
  const refreshUserProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
        await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      // Stop loading only after the initial session is handled.
      // Subsequent events (TOKEN_REFRESHED, etc.) will not change the loading state.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
        setIsUserLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (isUserLoading) return;

    const isAuthPage = pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');

    // If there is no user and they are not on an auth or admin page, redirect them.
    if (!user && !isAuthPage && !isAdminPage) {
      router.replace('/');
    }
    
    // If there IS a logged-in (not anonymous) user and they are on the auth page, redirect to menu.
    if (user && !user.is_anonymous && isAuthPage) {
      router.replace('/menu');
    }

  }, [user, isUserLoading, pathname, router]);

  const value = {
    supabase,
    user,
    userProfile,
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
