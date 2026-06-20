'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
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

  useEffect(() => {
    let isMounted = true;

    // Safety net: never let the app hang on the initial loading screen, even
    // if the very first auth event is delayed for some reason.
    const loadingSafetyTimer = setTimeout(() => {
      if (isMounted) setIsUserLoading(false);
    }, 8000);

    // onAuthStateChange fires INITIAL_SESSION on registration (handling the
    // initial load) and TOKEN_REFRESHED whenever the token is renewed —
    // including when the tab regains focus, since autoRefreshToken is enabled
    // in client.ts. Supabase handles refresh/visibility internally, so no
    // manual timer or focus/visibility listeners are needed here.
    //
    // CRITICAL: this callback runs while Supabase holds the auth lock
    // (navigator.locks). It MUST stay synchronous — awaiting any Supabase call
    // here re-acquires the same lock and deadlocks the entire client, which
    // previously froze the app after tabbing out and back. Defer any Supabase
    // work with setTimeout(0) so the lock is released first.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log(`Supabase auth event: ${event}`);

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (!currentUser || event === 'SIGNED_OUT' || currentUser.is_anonymous) {
          setUserProfile(null);
        } else {
          setTimeout(() => {
            if (isMounted) fetchUserProfile(currentUser);
          }, 0);
        }

        // Auth state is now resolved — release the initial loading screen.
        setIsUserLoading(false);
        clearTimeout(loadingSafetyTimer);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingSafetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);


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
