
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, updateDoc, doc } from "firebase/firestore";
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
import { Button } from "@/components/ui/button";
import { Package, IndianRupee, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

type OrderFilter = "live" | "delivered" | "all";

const filterOptions: { label: string; value: OrderFilter }[] = [
    { label: "Live Orders", value: "live" },
    { label: "Delivered Orders", value: "delivered" },
    { label: "All Orders", value: "all" },
];

function AdminDashboard() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState<OrderFilter>("live");
  const { toast } = useToast();

  const allOrdersQuery = useMemoFirebase(
    () => (firestore ? query(collectionGroup(firestore, "orders")) : null),
    [firestore]
  );

  const { data: allOrders, isLoading } = useCollection<Order>(allOrdersQuery);

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    if (!firestore) return;

    if (!order.userId) {
      console.error(`Cannot update status for order #${order.id.slice(0, 7)} because it is missing a userId.`);
      toast({
        title: "Update Failed",
        description: `Order #${order.id.slice(0, 7)} is an old record and cannot be updated.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const orderRef = doc(firestore, "users", order.userId, "orders", order.id);
      await updateDoc(orderRef, { status });
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      if (error.code === 'not-found') {
        toast({
          title: "Update Failed: Not Found",
          description: `The order document for #${order.id.slice(0, 7)} could not be found. It may be an old or invalid record.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Update Failed",
          description: "An unexpected error occurred. Please check the console.",
          variant: "destructive"
        });
      }
    }
  };
  
  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    
    // Default sort: newest first
    const sorted = [...allOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    switch (filter) {
      case "live":
        return sorted.filter(o => o.status === "Pending" || o.status === "Ready for Pickup");
      case "delivered":
        return sorted.filter(o => o.status === "Delivered");
      case "all":
      default:
        return sorted;
    }
  }, [allOrders, filter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [filteredOrders]);

  const totalOrders = filteredOrders.length;
  
  const activeFilterIndex = filterOptions.findIndex(f => f.value === filter);


  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-24" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16" />
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
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">
              Based on {totalOrders} {filter !== 'all' ? filter : ''} order(s)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
             <p className="text-xs text-muted-foreground">
              Showing {filter} orders
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="bg-muted p-1 rounded-full flex relative">
         <div 
            className="absolute top-1 left-1 bottom-1 bg-background rounded-full shadow-md transition-transform duration-300 ease-in-out"
            style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(calc(${activeFilterIndex * 100}% + ${activeFilterIndex * 4}px))` }}
          />
          {filterOptions.map((option) => (
             <Button 
                key={option.value}
                variant="ghost" 
                className={cn(
                    "flex-1 z-10 transition-colors duration-300 hover:bg-transparent focus-visible:bg-transparent rounded-full",
                    filter === option.value ? "text-primary font-semibold" : "text-muted-foreground"
                )}
                onClick={() => setFilter(option.value)}
            >
                {option.label}
            </Button>
          ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {order.items.map(item => (
                            <div key={item.id} className="font-semibold">{item.name} (x{item.quantity})</div>
                        ))}
                    </TableCell>
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
                    <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                        {order.status === 'Pending' && (
                            <>
                            <Button size="sm" onClick={() => handleStatusChange(order, 'Ready for Pickup')}>
                                Ready
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order, 'Cancelled')}>
                                Cancel
                            </Button>
                            </>
                        )}
                        {order.status === 'Ready for Pickup' && (
                            <>
                              <Button size="sm" onClick={() => handleStatusChange(order, 'Delivered')}>
                                Delivered
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order, 'Cancelled')}>
                                  Cancel
                              </Button>
                            </>
                        )}
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        No {filter} orders found.
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


export default function AdminPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Admin Dashboard
                </h1>
            </header>
            <AdminDashboard />
        </div>
    );
}

    