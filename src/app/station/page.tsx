
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogIn, HardHat, Loader2, LogOut } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/provider';
import type { Station } from '@/lib/types';
import Link from 'next/link';

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
  const [stations, setStations] = useState<Station[]>([]);
  const [isFetchingStations, setIsFetchingStations] = useState(true);

  const handleLogout = async () => {
    if (supabase) {
        await supabase.auth.signOut();
    }
  }

  useEffect(() => {
    async function fetchStations() {
        if (!supabase) return;
        setIsFetchingStations(true);
        const { data, error } = await supabase
            .from('stations')
            .select('*')
            .eq('active', true);
        
        if (error) {
            console.error("Error fetching stations", error);
            setStations([]);
        } else {
            setStations(data as Station[]);
        }
        setIsFetchingStations(false);
    }
    
    if (user && !user.is_anonymous && userProfile?.role === 'admin') {
      fetchStations();
    }
  }, [user, userProfile, supabase]);


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

  if (isFetchingStations) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Loading stations...</p>
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
        {stations.map(station => (
            <Link key={station.id} href={`/station/${station.code}`}>
                <Card className="text-center hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <HardHat className="mx-auto h-12 w-12 text-primary mb-4" />
                        <CardTitle className="text-3xl">{station.name}</CardTitle>
                        {station.description && <CardDescription>{station.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full">Go to {station.name}</Button>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
       <div className="absolute bottom-4 right-4">
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
       </div>
    </div>
  );
}
