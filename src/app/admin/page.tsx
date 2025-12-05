
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, collectionGroup, query, orderBy } from 'firebase/firestore';
import type { Order, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, Loader2, DollarSign, ShoppingBag, Users, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ADMIN_EMAIL = 'baudie.tv@gmail.com';

function AdminDashboard() {
  const firestore = useFirestore();
  const { user } = useUser(); // We know user is the admin here

  // Memoize queries only when firestore and the admin user are available
  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.email !== ADMIN_EMAIL) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore, user]);

  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.email !== ADMIN_EMAIL) return null;
    return query(collection(firestore, 'users'), orderBy('email'));
  }, [firestore, user]);

  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useCollection<Order>(allOrdersQuery);
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useCollection<UserProfile>(allUsersQuery);

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

  const isLoading = isLoadingOrders || isLoadingUsers;
  const error = ordersError || usersError;

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
        <AlertTitle>Error Fetching Data</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome, {user?.email}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
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
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>A list of the most recent orders.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-96 overflow-y-auto">
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
                              <p className="font-bold text-foreground mt-1">₹{order.totalAmount.toFixed(2)}</p>
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

         <Card>
            <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>List of all users who have signed up.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {users && users.length > 0 ? (
                            users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={undefined} alt={u.name} />
                                        <AvatarFallback>{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {u.name}
                                </TableCell>
                                <TableCell>{u.email}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                No users found.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}


export default function AdminPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>
                        <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        Authentication Required
                    </CardTitle>
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

  if (user.email !== ADMIN_EMAIL) {
    return (
         <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>
                        <Lock className="mx-auto h-12 w-12 text-destructive mb-4" />
                        Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        You do not have permission to access this page.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/menu">Go to Menu</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
        <AdminDashboard />
    </div>
  );
}
