"use client";

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, orderBy } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function AdminOrderSkeleton() {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function AdminPage() {
    const firestore = useFirestore();

    const allOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
    }, [firestore]);

    const { data: orders, isLoading, error } = useCollection<Order>(allOrdersQuery);
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight font-headline">
                Admin Dashboard
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                View all customer orders.
                </p>
            </div>

            {isLoading && <AdminOrderSkeleton />}
            
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Orders</AlertTitle>
                    <AlertDescription>
                        Could not fetch all orders. This is likely a Firestore security rule issue. 
                        For an admin to view all orders, the data structure might need to be changed to a top-level `orders` collection,
                        and security rules would need to grant admin-only access. The current structure `/users/{userId}/orders` prevents this by design.
                    </AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && (
                 <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders && orders.length > 0 ? orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.slice(0,7)}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{order.userId}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                                            className={cn(order.status === 'Delivered' && 'bg-green-600 text-white')}>
                                                {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                    <TableCell className="text-right font-bold">${order.totalAmount.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}
