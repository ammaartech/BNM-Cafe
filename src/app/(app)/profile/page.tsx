
'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Mail, Shield, ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const { user, userProfile, supabase, isUserLoading, refreshUserProfile } = useSupabase();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  const handleAvatarClick = () => {
      avatarInputRef.current?.click();
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0 || !user || !supabase) {
          return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      setIsUploading(true);

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
          toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
          setIsUploading(false);
          return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
      });
      
      if (updateUserError) {
          toast({ title: 'Update Failed', description: updateUserError.message, variant: 'destructive' });
          setIsUploading(false);
          return;
      }

       const { error: updateProfileError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

       if (updateProfileError) {
          toast({ title: 'Profile Sync Failed', description: updateProfileError.message, variant: 'destructive' });
      }

      await refreshUserProfile();
      setIsUploading(false);
      toast({ title: 'Success', description: 'Your profile picture has been updated.' });
  }

  if (isUserLoading || !user || user.is_anonymous) {
    return <ProfileSkeleton />;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };
  
  const avatarUrl = user?.user_metadata?.avatar_url || userProfile?.avatar_url;

  return (
    <div className="flex flex-col h-full">
        <header className="p-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Profile</h1>
        </header>

        <main className="flex-grow flex flex-col p-4">
           { userProfile ? (
            <>
            <div className="flex flex-col items-center text-center pt-8">
                <div className="relative group mb-4">
                    <Avatar className="h-24 w-24 text-3xl">
                        <AvatarImage src={avatarUrl} alt={userProfile.name} />
                        <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                    </Avatar>
                    <input 
                        type="file" 
                        ref={avatarInputref} 
                        onChange={handleAvatarUpload}
                        className="hidden" 
                        accept="image/png, image/jpeg" 
                        disabled={isUploading}
                    />
                    <div 
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={handleAvatarClick}
                    >
                       {isUploading ? (
                           <Loader2 className="h-8 w-8 text-white animate-spin" />
                       ) : (
                           <Edit className="h-8 w-8 text-white" />
                       )}
                    </div>
                </div>

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
            </>
           ) : (
                <ProfileSkeleton />
           )}
        </main>
    </div>
  );
}
