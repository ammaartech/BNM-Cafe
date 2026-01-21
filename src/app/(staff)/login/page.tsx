
'use client';

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";


export default function StaffLoginPage() {
    const { supabase, user, isUserLoading } = useSupabase();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      // If user is already logged in, redirect them to the station selector
      if (!isUserLoading && user) {
        router.replace('/staff/station');
      }
    }, [user, isUserLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else {
            // On success, the middleware will handle access control on the next navigation.
            // We just need to redirect to a protected route.
            router.replace('/staff/station');
        }
        setIsLoading(false);
    };
    
    const generalError = searchParams.get('error');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
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
                        {generalError === 'profile_not_found' && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Login Error</AlertTitle>
                                <AlertDescription>Could not find a user profile. Please contact an administrator.</AlertDescription>
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
