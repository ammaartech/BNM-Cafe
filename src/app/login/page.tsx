"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth, useUser, initiateEmailSignIn } from "@/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-none">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/">
                <ArrowLeft />
            </Link>
        </Button>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="w-full max-w-sm mx-auto text-center">
            <div className="text-left mb-8">
                <h1 className="text-4xl font-bold">Welcome Back!</h1>
                <p className="text-muted-foreground mt-2">Sign in to continue your delicious journey.</p>
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
                        className="bg-input h-12"
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
                        className="bg-input h-12 pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-muted-foreground"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                </Button>
            </form>
        </div>
      </div>

      <div className="flex-none text-center mt-8">
        <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary">
                Sign up
            </Link>
        </p>
      </div>
    </div>
  );
}
