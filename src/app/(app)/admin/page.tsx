'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collectionGroup, query, orderBy, doc } from 'firebase/firestore';
import type { Order, OrderItem } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ADMIN_PIN = 'admin123';

function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const allOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'orders'),
      orderBy('orderDate', 'desc')
    );
  }, [firestore]);

  const { data: orders, isLoading, error } = useCollection<Order>(allOrdersQuery);

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, `users/${order.userId}/orders/${order.id}`);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({
        title: "Order Updated",
        description: `Order #${order.id.slice(0,7)} status set to ${newStatus}.`
    })
  };

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
        <p className="mt-1 text-muted-foreground">Manage all customer orders.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>
                      {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                    </TableCell>
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
                        <Select
                            defaultValue={order.status}
                            onValueChange={(value: Order['status']) => handleStatusChange(order, value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancel Order</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
            Please enter the PIN to manage orders.
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

  return <AdminDashboard />;
}
