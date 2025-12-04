"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth, useUser, initiateEmailSignIn } from "@/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 9.658C34.576 5.842 29.623 3.5 24 3.5C13.734 3.5 5.5 11.734 5.5 22s8.234 18.5 18.5 18.5c10.005 0 17.961-7.794 18.5-18.083l.111-1.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.843-5.843C34.576 5.842 29.623 3.5 24 3.5C16.293 3.5 9.475 8.136 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36.5 24 36.5c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H24v8h11.303a12.042 12.042 0 0 1-4.087 5.571l6.19 5.238C42.012 34.095 44 28.892 44 24c0-1.933-.186-3.81-.529-5.627l-.86-2.29z"
      />
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.01,2.02c-1.3,0-2.54,0.52-3.46,1.44c-0.95,0.95-1.5,2.23-1.5,3.58c0,1.47,0.61,2.8,1.62,3.7c0.97,0.85,2.26,1.26,3.48,1.26c0.1,0,0.2,0,0.3,0c-0.1,0.2-0.2,0.4-0.3,0.6c-0.5,1.1-1.2,2.2-2.1,3.3c-0.8,0.9-1.6,1.8-2.5,2.7c-1.9,1.9-3.8,3.8-3.8,5.8c0,0.1,0.1,0.2,0.2,0.2c1.9,0,3.3-0.8,4.7-2.2c1.3-1.3,2.4-2.8,3.5-4.5c1.1,1.7,2.2,3.2,3.5,4.5c1.4,1.4,2.8,2.2,4.7,2.2c0.1,0,0.2-0.1,0.2-0.2c0-2-1.9-3.9-3.8-5.8c-0.9-0.9-1.7-1.8-2.5-2.7c-0.9-1.1-1.6-2.2-2.1-3.3c-0.1-0.2-0.2-0.4-0.3-0.6c0.1,0,0.2,0,0.3,0c1.22,0,2.51-0.41,3.48-1.26c1.01-0.9,1.62-2.23,1.62-3.7c0-1.35-0.55-2.63-1.5-3.58C14.55,2.54,13.31,2.02,12.01,2.02z M12.01,3.22c0.91,0,1.76,0.36,2.39,0.99c0.63,0.63,1.01,1.5,1.01,2.43c0,0.94-0.38,1.82-1.03,2.47c-0.61,0.61-1.44,0.91-2.37,0.91c-0.93,0-1.76-0.3-2.37-0.91c-0.65-0.65-1.03-1.53-1.03-2.47c0-0.93,0.38-1.8,1.01-2.43C10.25,3.58,11.1,3.22,12.01,3.22z"></path>
        </svg>
    )
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading, userError } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/menu");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if(userError) {
      setError(userError.message);
      setIsLoading(false);
    }
  }, [userError])


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    initiateEmailSignIn(auth, email, password);
  };

  if (isUserLoading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">B.N.M Cafe</h1>
        <div className="bg-card p-6 rounded-lg shadow-sm w-full">
            <div className="text-left mb-6">
                <h2 className="text-3xl font-bold">Heyyy There!</h2>
                <p className="text-muted-foreground text-sm mt-1">Food is symbolic of love when words are inadequate watchya waiting for?</p>
            </div>
            
            {error && (
                <Alert variant="destructive" className="mb-4 text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid gap-2 text-left">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="bg-muted border-0"
                    />
                </div>
                <div className="grid gap-2 text-left relative">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={isLoading}
                        className="bg-muted border-0 pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-muted-foreground"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or sign in with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12" disabled={isLoading}>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Google
              </Button>
               <Button variant="outline" className="h-12" disabled={isLoading}>
                <AppleIcon className="mr-2 h-5 w-5" />
                Apple
              </Button>
            </div>
        </div>

        <div className="mt-6 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary">
            Sign up here
            </Link>
        </div>
      </div>
    </div>
  );
}
