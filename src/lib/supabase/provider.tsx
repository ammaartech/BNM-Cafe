
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    // Anonymous users don't have profiles, but we are removing anonymous login,
    // so this check is for robustness.
    if (currentUser.is_anonymous) {
      setUserProfile(null);
      setUserRole('customer');
      return;
    }

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
        // If no user and we are not on an auth or admin page, redirect to login
        const isAuthPage = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');
        const isAdminPage = pathname.startsWith('/admin');
        if (!isAuthPage && !isAdminPage) {
            router.push('/');
        }
      }
      
      setIsUserLoading(false);
    };

    getSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsUserLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          setUserProfile(null);
          setUserRole(null);
          // When user logs out, or session expires, redirect to login page
          // unless they are already on an auth or admin page (which has its own login).
          const isAuthPage = window.location.pathname === '/' || window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
          const isAdminPage = window.location.pathname.startsWith('/admin');
           if (!isAuthPage && !isAdminPage) {
            router.push('/');
          }
        }
        setIsUserLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile, pathname, router]);

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
