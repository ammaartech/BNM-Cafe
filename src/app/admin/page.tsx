
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle, Loader2, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ADMIN_PIN = 'admin123';

function AdminDashboard() {
  const firestore = useFirestore();

  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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

  const handleVerify = ().Got it. The PIN has now been set to `admin123`.