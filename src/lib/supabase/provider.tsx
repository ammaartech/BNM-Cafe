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
    // 🛡️ HOTFIX: Supabase's getSession() can hang indefinitely if Web Locks are
    // stuck (e.g. tab backgrounded/suspended or multiple tabs racing).
    // We add a 3-second timeout so the app doesn't stay stuck on the loading screen.
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000);
    });

    const sessionPromise = supabase.auth.getSession().catch((err) => {
      console.error("Supabase getSession error:", err);
      return null;
    });

    Promise.race([sessionPromise, timeoutPromise]).then(async (result) => {
      // result is either { data: { session } } or null (timeout/error)
      const session = result && 'data' in result ? result.data.session : null;
      if (session) {
        await processSession(session);
      }
      setIsUserLoading(false); // Always unlock the UI eventually
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
