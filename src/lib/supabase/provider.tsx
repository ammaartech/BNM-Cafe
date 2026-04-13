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
    let sessionTimeout: NodeJS.Timeout;

    const checkSessionActivity = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setUser(null);
          setUserProfile(null);
        } else if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const timeUntilExpiry = expiresAt - Date.now();

          if (timeUntilExpiry < 5000) {
            console.log("Token expiring soon, actively refreshing immediately...");
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !data.session) {
              console.error("Failed to actively refresh token. Logging out.", refreshError);
              setUser(null);
              setUserProfile(null);
            }
          } else {
            // Schedule the next check 1 minute before expiry, or at least 5 seconds from now
            clearTimeout(sessionTimeout);
            sessionTimeout = setTimeout(checkSessionActivity, Math.max(timeUntilExpiry - 60000, 5000));
          }
        }
      } catch (err) {
        console.error("Error during session check:", err);
      }
    };

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          await processSession(null);
        } else {
          await processSession(session);
        }
        await checkSessionActivity(); // start adaptive check
      } catch (err) {
        console.error("Critical session init error:", err);
      } finally {
        setIsUserLoading(false);
      }
    };

    initSession();

    // Listen for ALL auth events to ensure NO DELAYS when state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event detected: ${event}`);

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserProfile(null);
          clearTimeout(sessionTimeout);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await processSession(session);
          await checkSessionActivity();
        }
      }
    );

    // Actively verify session immediately whenever the user switches back to the tab
    const handleVisibilityCange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionActivity();
      }
    };

    const handleFocus = () => {
      checkSessionActivity();
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityCange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(sessionTimeout);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityCange);
        window.removeEventListener('focus', handleFocus);
      }
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
