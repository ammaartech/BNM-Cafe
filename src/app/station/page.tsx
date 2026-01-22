
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogIn, HardHat } from 'lucide-react';

export default function StationHomePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
      setError(null);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  const handleLogout = () => {
    setPassword('');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Station Access</CardTitle>
            <CardDescription className="text-center">Enter password to select a station.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
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
