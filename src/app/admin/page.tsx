
'use client';

import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, ShoppingBag, CheckCircle, LogOut, AlertCircle, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('isAdminAuthenticated', 'true');
      onLogin();
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-muted/50">
      <Card className="w-full max-w-sm p-6">
        <CardHeader className="p-2 text-center">
          <CardTitle className="text-2xl">Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
            </div>
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'));
  }, [firestore]);

  const { data: orders, isLoading, error } = useCollection<Order>(allOrdersQuery);

  const handleUpdateStatus = async (order: Order) => {
    if (!firestore) return;
    try {
        const orderRef = doc(firestore, 'users', order.userId, 'orders', order.id);
        await updateDoc(orderRef, { status: 'Ready for Pickup' });
        toast({
            title: 'Order Updated',
            description: `Order #${order.id.slice(0, 7)} is now ready for pickup.`
        })
    } catch(e) {
        console.error("Failed to update order status: ", e);
        toast({
            title: 'Update Failed',
            description: 'Could not update the order status.',
            variant: 'destructive'
        })
    }
  }

  const stats = {
    totalRevenue: orders?.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.totalAmount, 0) || 0,
    totalOrders: orders?.length || 0,
    successfulPayments: orders?.filter(o => o.status === 'Delivered').length || 0,
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading orders: {error.message}</div>
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.successfulPayments}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                    <TableCell>{order.userName || 'N/A'}</TableCell>
                    <TableCell>{order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}</TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                       <Badge 
                          variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                          className={cn({
                              'bg-green-600 text-white': order.status === 'Delivered',
                              'bg-yellow-500 text-white': order.status === 'Ready for Pickup',
                          })}
                        >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {order.status === 'Pending' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(order)}>
                               <Check className="mr-2 h-4 w-4" /> Ready
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {orders && orders.length === 0 && (
                <div className="text-center text-muted-foreground p-8">No orders found.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This check runs only on the client-side
    const isAdmin = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAuthenticated(isAdmin);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
  };

  if (typeof window === 'undefined') {
    // Render nothing on the server to avoid hydration mismatch
    return null;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
