
'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Mail, Shield, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

function ProfileSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-24" />
            </header>
            <main className="flex-grow flex flex-col p-4 items-center text-center pt-8">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-5 w-48" />

                <div className="w-full mt-12 space-y-4">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
                 <div className="w-full mt-auto">
                    <Skeleton className="h-12 w-full" />
                 </div>
            </main>
        </div>
    )
}


export default function ProfilePage() {
  const { user, userProfile, supabase, isUserLoading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && (!user || user.is_anonymous)) {
      router.replace('/');
    }
  }, [isUserLoading, user, router]);


  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  if (isUserLoading || !user || !userProfile) {
    return <ProfileSkeleton />;
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0) : '';
  };

  return (
    <div className="flex flex-col h-full">
        <header className="p-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Profile</h1>
        </header>

        <main className="flex-grow flex flex-col p-4">
            <div className="flex flex-col items-center text-center pt-8">
                <Avatar className="h-24 w-24 text-3xl mb-4">
                    <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                </Avatar>

                <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                <p className="text-muted-foreground">{userProfile.email}</p>
            </div>

            <div className="mt-12 space-y-4 flex-grow">
                <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{userProfile.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Role</p>
                                <p className="font-semibold capitalize">{userProfile.role}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-8">
                <Button variant="destructive" className="w-full h-12 text-base" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </main>
    </div>
  );
}
