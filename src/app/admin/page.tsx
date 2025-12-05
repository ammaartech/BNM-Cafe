
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle, Loader2, DollarSign, ShoppingBag, Users, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ADMIN_PIN = 'admin123';

function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const allOrdersQuery = useMemoFirebase(() => {
    // Only run the query if we have a firestore instance AND a user
    if (!firestore || !user) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore, user]);

  const { data: orders, isLoading, error } = useCollection<Order>(allOrdersQuery);

  const totalRevenue = useMemo(() => {
    return orders?.reduce((acc, order) => acc + order.totalAmount, 0) || 0;
  }, [orders]);

  const totalOrders = useMemo(() => {
    return orders?.length || 0;
  }, [orders]);
  
  const uniqueCustomers = useMemo(() => {
    if (!orders) return 0;
    const customerIds = new Set(orders.map(order => order.userId));
    return customerIds.size;
  }, [orders]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Please sign in to view the admin dashboard.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Sign In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching Orders</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome to the central hub for your cafe.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>A list of the most recent orders.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {orders && orders.length > 0 ? (
              orders.slice(0, 10).map((order) => (
                <Link href={`/admin/orders/${order.id}?userId=${order.userId}`} key={order.id} className="block hover:bg-muted/50">
                    <div className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">Order #{order.id.slice(0, 7)}</p>
                            <p className="text-sm text-muted-foreground">{order.userName} - {new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                             <Badge 
                                variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                                className={cn('font-semibold', {
                                    'bg-green-600 text-white': order.status === 'Delivered',
                                    'bg-yellow-500 text-white': order.status === 'Ready for Pickup',
                                })}
                            >
                                {order.status}
                            </Badge>
                            <p className="font-bold text-foreground mt-1">${order.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-center text-muted-foreground">No orders found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PinEntry({ onPinVerified }: { onPinVerified: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (pin === ADMIN_PIN) {
      onPinVerified();
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            Admin Access Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please enter the PIN to access the dashboard.
          </p>
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleVerify} className="w-full">
            Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const [isVerified, setIsVerified] = useState(false);

  if (!isVerified) {
    return <PinEntry onPinVerified={() => setIsVerified(true)} />;
  }

  return (
    <div className="container mx-auto py-6">
        <AdminDashboard />
    </div>
  );
}
