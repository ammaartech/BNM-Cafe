'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { clearPersistedCache } from '@/lib/swr';

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// The profile (name + role) rarely changes, so it is cached per device. That
// lets role-gated screens render on the first frame instead of flashing
// "Access denied" while the profile request is in flight.
const PROFILE_KEY = 'bnm:profile';

function readCachedProfile(userId: string): UserProfile | null {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    return profile?.id === userId ? profile : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: UserProfile | null) {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Storage blocked: the profile is simply fetched every load.
  }
}

function sameUser(a: User | null, b: User | null) {
  return !!a && !!b && a.id === b.id && a.updated_at === b.updated_at && a.is_anonymous === b.is_anonymous;
}

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    // Whose profile is loaded (or loading); a refresh for the same account skips the refetch.
    let profileFor: string | null = null;

    // Safety net: never let the app hang on the initial loading screen, even
    // if the very first auth event is delayed for some reason.
    const loadingSafetyTimer = setTimeout(() => {
      if (isMounted) setIsUserLoading(false);
    }, 8000);

    const settle = () => {
      setIsUserLoading(false);
      clearTimeout(loadingSafetyTimer);
    };

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (!isMounted || profileFor !== userId) return;
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(data);
        writeCachedProfile(data);
      }
      settle();
    };

    // onAuthStateChange fires INITIAL_SESSION on registration (handling the
    // initial load) and TOKEN_REFRESHED whenever the token is renewed.
    //
    // CRITICAL: this callback runs while Supabase holds the auth lock. It MUST
    // stay synchronous — awaiting any Supabase call here re-acquires the same
    // lock and deadlocks the client. Defer Supabase work with setTimeout(0).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      const nextUser = session?.user ?? null;
      // Keep the same object across token refreshes, so every effect keyed on
      // `user` (realtime subscriptions, fetches) doesn't tear down and re-run.
      setUser((prev) => (sameUser(prev, nextUser) ? prev : nextUser));

      if (!nextUser || nextUser.is_anonymous) {
        profileFor = null;
        setUserProfile(null);
        if (event === 'SIGNED_OUT') {
          writeCachedProfile(null);
          clearPersistedCache();
        }
        settle();
        return;
      }

      if (profileFor === nextUser.id && event !== 'USER_UPDATED') {
        settle();
        return;
      }

      profileFor = nextUser.id;
      const cached = readCachedProfile(nextUser.id);
      setUserProfile(cached);
      if (cached) settle();
      else setIsUserLoading(true);

      setTimeout(() => {
        if (isMounted) loadProfile(nextUser.id);
      }, 0);
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingSafetyTimer);
      subscription.unsubscribe();
    };
  }, []);

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
