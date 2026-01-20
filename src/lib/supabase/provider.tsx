
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
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

  const processSession = useCallback(async (session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
    }, [fetchUserProfile]);


  useEffect(() => {
    // Handle the initial session on page load to prevent UI flicker.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await processSession(session);
      setIsUserLoading(false); // Initial load is complete.
    });

    // Listen for subsequent auth events like sign-in or sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // We only re-process on explicit sign-in/out, not on token refreshes.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          await processSession(session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [processSession]);


  useEffect(() => {
    if (isUserLoading) return;

    const isAuthPage = pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');

    if (!user && !isAuthPage && !isAdminPage) {
      router.replace('/');
    }
    
    if (user && !user.is_anonymous && isAuthPage) {
      router.replace('/menu');
    }

  }, [user, isUserLoading, pathname, router]);

  const value = useMemo(() => ({
    supabase,
    user,
    userProfile,
    isUserLoading,
  }), [user, userProfile, isUserLoading]);

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
