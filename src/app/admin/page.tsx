
"use client";

import { supabase } from "@/lib/supabase/client";
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
import { Package, IndianRupee, ShoppingCart, LogIn, AlertCircle, LogOut, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";


type OrderFilter = "live" | "delivered" | "all";

const filterOptions: { label: string; value: OrderFilter }[] = [
    { label: "Live Orders", value: "live" },
    { label: "Delivered Orders", value: "delivered" },
    { label: "All Orders", value: "all" },
];

function formatOrder(orderData: any): Order | null {
  if (!orderData || !orderData.id) return null;
  return {
    id: orderData.id,
    userId: orderData.user_id,
    userName: orderData.user_name,
    orderDate: orderData.order_date,
    totalAmount: orderData.total_amount,
    status: orderData.status,
    items: orderData.order_items || [],
  };
}

function AdminDashboard() {
  const [filter, setFilter] = useState<OrderFilter>("live");
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchInitialOrders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('order_date', { ascending: false });

        if (error) {
            console.error("Error fetching initial orders:", error);
            toast({ title: "Error", description: "Could not fetch orders. Check RLS policies.", variant: "destructive" });
        } else if (data) {
            const formatted = data.map(formatOrder).filter((o): o is Order => o !== null);
            setAllOrders(formatted);
        }
        setIsLoading(false);
    };

    fetchInitialOrders();

    const channel = supabase.channel('realtime-orders')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            async (payload) => {
                 const { eventType, new: newRecord, old: oldRecord, table } = payload;
                 if (table !== 'orders') return;

                 if (eventType === 'INSERT') {
                    const { data: newOrderData, error } = await supabase
                        .from('orders')
                        .select('*, order_items(*)')
                        .eq('id', newRecord.id)
                        .single();
                    
                    if (!error && newOrderData) {
                        const formattedOrder = formatOrder(newOrderData);
                        if (formattedOrder) {
                            setAllOrders(currentOrders => [formattedOrder, ...currentOrders]);
                        }
                    }
                 } else if (eventType === 'UPDATE') {
                    const formattedOrder = formatOrder(newRecord);
                    if (formattedOrder) {
                        setAllOrders(currentOrders => 
                            currentOrders.map(order => 
                                order.id === formattedOrder.id ? { ...order, status: formattedOrder.status } : order
                            )
                        );
                    }
                 } else if (eventType === 'DELETE') {
                    setAllOrders(currentOrders => 
                        currentOrders.filter(order => order.id !== (oldRecord as any).id)
                    );
                 }
            }
        )
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }
  }, [toast]);
  

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    setUpdatingStatus(prev => ({ ...prev, [order.id]: true }));

    const originalStatus = order.status;
    
    // Optimistic UI update
    setAllOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);

    if (error) {
        // Revert UI on failure
        setAllOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: originalStatus } : o));
        toast({ title: "Update Failed", description: error.message, variant: "destructive"});
    } else {
        toast({ title: "Status Updated", description: `Order #${order.id.slice(0,7)} is now ${newStatus}.`});
    }
    setUpdatingStatus(prev => ({ ...prev, [order.id]: false }));
  };
  
  const filteredOrders = useMemo(() => {
    const sorted = [...allOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    switch (filter) {
      case "live":
        return sorted.filter(o => o.status === "Pending" || o.status === "Ready for Pickup");
      case "delivered":
        return sorted.filter(o => o.status === "Delivered" || o.status === "Cancelled");
      case "all":
      default:
        return sorted;
    }
  }, [allOrders, filter]);

  const totalRevenue = useMemo(() => {
    const ordersToSum = filter === 'all' 
        ? allOrders.filter(o => o.status === 'Delivered')
        : filteredOrders.filter(o => o.status === 'Delivered');
    return ordersToSum.reduce((sum, order) => sum + order.totalAmount, 0);
  }, [filteredOrders, allOrders, filter]);

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
             {filter === 'all' ? 'Total Delivered Revenue' : 'Revenue from selection'}
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
                filteredOrders.map((order) => {
                    const isUpdating = updatingStatus[order.id];
                    return (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                            <TableCell>{order.userName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                                {order.items?.map(item => (
                                    <div key={item.id} className="font-semibold truncate">{item.name} (x{item.quantity})</div>
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
                                    <Button size="sm" onClick={() => handleStatusChange(order, 'Ready for Pickup')} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Ready'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order, 'Cancelled')} disabled={isUpdating}>
                                        Cancel
                                    </Button>
                                    </>
                                )}
                                {order.status === 'Ready for Pickup' && (
                                    <>
                                    <Button size="sm" onClick={() => handleStatusChange(order, 'Delivered')} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Delivered'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(order, 'Cancelled')} disabled={isUpdating}>
                                        Cancel
                                    </Button>
                                    </>
                                )}
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })
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
    const { user, userRole, isUserLoading, supabase } = useSupabase();
    const router = useRouter();
    const isAdmin = user && !user.is_anonymous && userRole === 'admin';

     const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/');
    };

    if (isUserLoading) {
         return (
             <div className="flex items-center justify-center h-full">
                <Skeleton className="h-96 w-full max-w-sm" />
            </div>
         );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
            {isAdmin ? (
                <>
                    <header className="mb-6 flex justify-between items-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground text-center flex-grow">
                            Admin Dashboard
                        </h1>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </header>
                    <AdminDashboard />
                </>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <AdminLoginPage />
                </div>
            )}
        </div>
    );
}

    