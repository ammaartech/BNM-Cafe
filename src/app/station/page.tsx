
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogIn, HardHat, Loader2, LogOut } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/provider';


function StationLoginPage() {
    const { supabase } = useSupabase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-full w-full">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Station Access</CardTitle>
                     <CardDescription className="text-center">Enter admin credentials to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Login Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


export default function StationHomePage() {
  const router = useRouter();
  const { user, userProfile, isUserLoading, supabase } = useSupabase();

  const handleLogout = async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
  }

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const isUserAdmin = user && !user.is_anonymous && userProfile?.role === 'admin';

  if (!isUserAdmin) {
    const isUserLoggedInButNotAdmin = user && !user.is_anonymous && userProfile?.role !== 'admin';
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
            {isUserLoggedInButNotAdmin ? (
               <Card className="w-full max-w-sm">
                   <CardHeader>
                       <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
                   </CardHeader>
                   <CardContent className="text-center">
                       <Alert variant="destructive" className="mb-4">
                           <AlertCircle className="h-4 w-4" />
                           <AlertTitle>Permission Error</AlertTitle>
                           <AlertDescription>You do not have permission to access station selection.</AlertDescription>
                       </Alert>
                       <Button variant="outline" onClick={handleLogout} className="w-full">
                           <LogOut className="mr-2 h-4 w-4" /> Logout
                       </Button>
                   </CardContent>
               </Card>
           ) : (
               <StationLoginPage />
           )}
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Select a Station</h1>
        <p className="text-muted-foreground mt-2">Choose which station you are operating.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card 
            className="text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => router.push('/station/station-1')}
        >
          <CardHeader>
            <HardHat className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-3xl">Station 1</CardTitle>
            <CardDescription>Hot Kitchen & Main Courses</CardDescription>
          </CardHeader>
          <CardContent>
             <Button className="w-full">Go to Station 1</Button>
          </CardContent>
        </Card>
        <Card 
            className="text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => router.push('/station/station-2')}
        >
          <CardHeader>
            <HardHat className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-3xl">Station 2</CardTitle>
            <CardDescription>Chats & Refreshments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Go to Station 2</Button>
          </CardContent>
        </Card>
      </div>
       <div className="absolute bottom-4 right-4">
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
       </div>
    </div>
  );
}
