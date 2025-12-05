
'use client';

import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Heart, ClipboardList, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

function ProfileSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
      <div className="mt-8 space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };

  if (isUserLoading || isProfileLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    // This should ideally not be reached if page is protected, but as a fallback:
    router.push('/login');
    return <ProfileSkeleton />;
  }

  const menuItems = [
    {
      label: 'My Orders',
      icon: ClipboardList,
      href: '/orders',
    },
    {
      label: 'My Favorites',
      icon: Heart,
      href: '/profile/favorites',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="bg-card p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage src={user.photoURL || undefined} alt={userProfile?.name} />
            <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon />}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{userProfile?.name || 'Cafe Patron'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="flex-grow p-4">
        <Card>
            <ul className="divide-y">
                {menuItems.map((item) => (
                    <li key={item.href}>
                        <Link href={item.href}>
                            <div className="flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <item.icon className="h-5 w-5 mr-4 text-primary" />
                                <span className="flex-grow font-medium">{item.label}</span>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </Card>
      </div>

      <div className="p-4">
        <Button variant="ghost" className="w-full justify-start p-4 text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
