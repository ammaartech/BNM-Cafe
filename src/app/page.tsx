
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/provider';
import Image from 'next/image';

function AuthForm() {
  const router = useRouter();
  const { user, isUserLoading } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    // If user is loaded and logged in (and not anonymous), redirect them
    if (!isUserLoading && user && !user.is_anonymous) {
      router.replace('/menu');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || (user && !user.is_anonymous)) {
    // Show a loader or a blank screen while loading/redirecting to prevent flickering
    return <div className="h-screen w-screen bg-background" />;
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    // On success, the SupabaseProvider's useEffect will handle the redirect.
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
        // Also create a profile in the 'users' table
        const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            name: name,
            email: email,
        });

        if (profileError) {
            setError(profileError.message);
        } else {
             // Sign in the user automatically after sign up to trigger onAuthStateChange
            await supabase.auth.signInWithPassword({ email, password });
        }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 flex flex-col items-center">
            <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={150} height={150} priority className="mb-4" />
            <div className="h-5 w-fit mx-auto mt-2">
              <div className="typewriter-container">
                <p className="typewriter-text text-muted-foreground">Your campus cafe companion.</p>
              </div>
            </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                   <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                    />
                  {error && activeTab === 'login' && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Login Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                     <LogIn className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>It's quick and easy to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-12"
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                    />
                    {error && activeTab === 'signup' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Sign Up Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                         <UserPlus className="ml-2 h-4 w-4" />
                    </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SplashPage() {
    return <AuthForm />;
}
