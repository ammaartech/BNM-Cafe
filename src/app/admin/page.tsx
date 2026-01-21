
"use client";

import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogIn, AlertCircle, LogOut, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function AdminDashboard({ supabase }: { supabase: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error);
        toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } else {
        setOrders(data || []);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.daily_order_id || order.id.slice(0, 7)}</TableCell>
                            <TableCell>{order.userName}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                                    className={cn('font-semibold', {
                                        'bg-green-600 text-white': order.status === 'Delivered',
                                        'bg-yellow-500 text-white': order.status === 'Ready for Pickup',
                                    })}
                                >
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{(order.totalAmount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No orders found.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}


function AdminLoginPage() {
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
                    <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
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

export default function AdminPage() {
    const { user, userProfile, isUserLoading, supabase } = useSupabase();
    const router = useRouter();

     const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/');
    };

    if (isUserLoading) {
         return (
             <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         );
    }
    
    const isUserAdmin = user && !user.is_anonymous && userProfile?.role === 'admin';

    if (!isUserAdmin) {
        const isUserLoggedInButNotAdmin = user && !user.is_anonymous && userProfile?.role !== 'admin';
        return (
             <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
                <div className="flex-grow flex items-center justify-center">
                    {isUserLoggedInButNotAdmin ? (
                        <Card className="w-full max-w-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Permission Error</AlertTitle>
                                    <AlertDescription>You do not have permission to access this page.</AlertDescription>
                                </Alert>
                                <Button variant="outline" onClick={handleLogout} className="w-full">
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <AdminLoginPage />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground text-center flex-grow">
                    Admin Dashboard
                </h1>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </header>
            <AdminDashboard supabase={supabase} />
        </div>
    );
}
