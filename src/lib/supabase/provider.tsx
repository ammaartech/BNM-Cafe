
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SupabaseContextType {
  supabase: SupabaseClient;
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
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (currentUser: User) => {
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

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      setUserRole('customer');
    } else if (profile) {
      setUserProfile(profile);
      setUserRole(profile.role || 'customer');
    } else {
      setUserProfile(null);
      setUserRole('customer');
    }
  }, []);
  
  const refreshUserProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
        await fetchUserProfile(currentUser);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        setIsUserLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          // If no user, sign in anonymously
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
              console.error("Anonymous sign-in error:", error);
              setUser(null);
              setUserProfile(null);
              setUserRole(null);
          } else if (data.user) {
              setUser(data.user);
              setUserProfile(null);
              setUserRole('customer');
          }
        }
        setIsUserLoading(false);
      }

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    // Initial check in case onAuthStateChange doesn't fire on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
             handleAuthChange('INITIAL_STATE', null);
        }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (isUserLoading) return;

    const isAuthPage = pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');

    // If user is anonymous and trying to access a protected page, redirect to login
    if (user?.is_anonymous && !isAuthPage && !isAdminPage && pathname !== '/menu' && !pathname.startsWith('/menu/')) {
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
