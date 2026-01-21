
'use client';

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { HardHat, LogIn, Loader2, AlertCircle, LogOut } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Station, UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Login Component for Staff
function StaffLoginPage() {
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
        // On success, the main page component will detect the user change and re-render.
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={100} height={100} priority className="mx-auto mb-4 invert" />
                    <CardTitle className="text-2xl text-center">Staff & Admin Login</CardTitle>
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
             <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-muted-foreground mt-4")}>
                &larr; Back to Customer App
            </Link>
        </div>
    );
}

// Station Selection Component
function StationSelectionView({ stations, userProfile }: { stations: Station[], userProfile: UserProfile | null }) {
   return (
    <>
      <div className="text-center mb-8">
        <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={120} height={120} priority className="mx-auto mb-4 invert" />
        <h1 className="text-3xl font-bold tracking-tight">Select Your Station</h1>
        <p className="text-muted-foreground">Choose your assigned station to view live orders.</p>
      </div>
      
      {stations.length > 0 || userProfile?.role === 'admin' ? (
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {userProfile?.role === 'admin' && (
            <Link href="/staff/admin/kot" className="block w-full sm:w-auto">
              <Card className="h-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg sm:min-w-[200px]">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold">Master KOT</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          )}
          {stations.map((station) => (
            <Link href={`/staff/station/${station.code}`} key={station.id} className="block w-full sm:w-auto">
              <Card className="h-full hover:bg-primary/10 hover:border-primary transition-all duration-200 shadow-lg sm:min-w-[200px]">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold">{station.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <HardHat className="w-8 h-8 text-destructive" />
                <div>
                    <CardTitle>No Active Stations</CardTitle>
                    <p className="text-muted-foreground">No station is assigned to your account.</p>
                </div>
            </CardHeader>
        </Card>
      )}
    </>
   );
}


export default function StationSelectionPage() {
    const { user, userProfile, isUserLoading, supabase } = useSupabase();
    const router = useRouter();
    const [stations, setStations] = useState<Station[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getStations() {
            if (!supabase || !userProfile) return;
            setIsLoading(true);
            
            let query = supabase
                .from("stations")
                .select("id, name, code")
                .eq("active", true);

            // If user is staff, filter by their assigned station_id
            if (userProfile.role === 'staff' && userProfile.station_id) {
                query = query.eq('id', userProfile.station_id);
            }

            const { data, error } = await query.order("sort_order", { ascending: true });

            if (error) {
                console.error("Error fetching stations:", error);
                setStations([]);
            } else if (data) {
                setStations(data as Station[]);
            }
            setIsLoading(false);
        }

        if (user && userProfile) {
            getStations();
        } else {
            setIsLoading(false);
        }
    }, [user, userProfile, supabase]);
    
    const handleLogout = async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push('/');
    };

    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <StaffLoginPage />
            </div>
        );
    }
    
    const isAuthorized = userProfile && (userProfile.role === 'staff' || userProfile.role === 'admin');

    if (!isAuthorized) {
       return (
         <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Permission Error</AlertTitle>
                        <AlertDescription>Your account does not have staff or admin permissions.</AlertDescription>
                    </Alert>
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" /> Logout and try another account
                    </Button>
                </CardContent>
            </Card>
        </div>
       )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="p-3 bg-card border-b shadow-sm flex justify-between items-center flex-shrink-0">
                <h1 className="text-xl font-bold tracking-tight">BNM Cafe Staff</h1>
                <Button variant="outline" onClick={handleLogout} size="sm">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <StationSelectionView stations={stations} userProfile={userProfile} />
            </main>
        </div>
    );
}
