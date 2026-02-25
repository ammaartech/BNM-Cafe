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
    // We remove the 3-second timeout hack because it caused forced logouts.
    // Instead we rely on Supabase's built-in session detection, ensuring the UI unlocks.
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Supabase getSession error - could be lock contention:", error);
          // Fallback to getUser if getSession fails due to lock issues
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await processSession({ user } as any); // Partial session just for user
          }
        } else if (session) {
          await processSession(session);
        }
      } catch (err) {
        console.error("Critial session init error:", err);
      } finally {
        setIsUserLoading(false);
      }
    };

    initSession();

    // Listen for subsequent auth events like sign-in or sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Process on sign-in, sign-out, or user updates
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
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

    const isAuthPage = pathname === '/login' || pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');
    const isStationPage = pathname.startsWith('/station');

    // If user is not logged in, and they are on a protected page, redirect to auth page.
    if (!user && !isAuthPage && !isAdminPage && !isStationPage) {
      router.replace('/login');
    }

    // If user is logged in (and not anon) and they are on the auth page, redirect to menu.
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
