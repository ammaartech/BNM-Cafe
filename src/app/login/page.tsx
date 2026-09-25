'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, UserPlus, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/provider';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { DEMO_ACCOUNT } from '@/lib/demo';
import { useTour } from '@/components/tour/TourProvider';

function AuthForm() {
  const router = useRouter();
  const { user, isUserLoading } = useSupabase();
  const { startTour } = useTour();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  useEffect(() => {
    // If user is loaded and logged in (and not anonymous), the provider will redirect them.
    // This is a failsafe.
    if (!isUserLoading && user && !user.is_anonymous) {
      router.replace('/menu');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (showVerificationDialog) {
      const timer = setTimeout(() => {
        setShowVerificationDialog(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showVerificationDialog]);


  if (isUserLoading || (user && !user.is_anonymous)) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
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

  // "Want to test?": sign in with the shared demo account, then walk the
  // visitor through the app. Without a demo account configured, the tour
  // still runs and asks them to sign up at its sign-in step.
  const handleTryDemo = async () => {
    if (!DEMO_ACCOUNT) {
      startTour('customer');
      return;
    }
    setIsDemoLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(DEMO_ACCOUNT);
    setIsDemoLoading(false);
    if (error) {
      setActiveTab('login');
      setError(`Demo sign-in failed: ${error.message}`);
      return;
    }
    // Signed in: the provider redirects to the menu, where the tour opens.
    startTour('customer');
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
      // If identities array is empty, this means the user already exists.
      // Supabase returns a fake user object for security reasons (to avoid enumeration attacks).
      if (data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Please log in.');
        setIsLoading(false);
        return;
      }

      // The profile row in `users` is created by the on_auth_user_created
      // trigger, from the name passed in `options.data` above.
      setShowVerificationDialog(true);
      setName('');
      setEmail('');
      setPassword('');
      setActiveTab('login');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-xs rounded-2xl p-0">
          <DialogHeader className="flex flex-col items-center justify-center text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl font-semibold">Verification Email Sent</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please check your email (and spam folder) to verify your account.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        <motion.div
          className="text-center mb-6 flex flex-col items-center"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <Image src="/bnmlogoB.png" alt="B.N.M Cafe Logo" width={150} height={150} priority className="mb-4 dark:brightness-0 dark:invert" />
          <div className="h-5 w-fit mx-auto mt-2">
            <div className="typewriter-container">
              <p className="typewriter-text text-muted-foreground">Your campus cafe companion.</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="w-full"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tour="auth-card">
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

          <div className="mt-4 text-center">
            <button
              type="button"
              data-tour="demo-login"
              onClick={handleTryDemo}
              disabled={isLoading || isDemoLoading}
              className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Opening the demo…
                </>
              ) : (
                <>
                  Want to test?
                  <span className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 group-hover:underline">
                    <Sparkles className="h-3.5 w-3.5" />
                    Take the guided demo
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthForm />;
}
