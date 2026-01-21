
"use client";

import type { Order, OrderStatus } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, AlertCircle, LogOut, Loader2, CheckCircle2, Clock, CookingPot, XCircle, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";

const statusDisplayMap: { [key in OrderStatus]?: { label: string; icon: React.ReactNode } } = {
    PENDING: { label: 'Pending', icon: <Clock className="h-4 w-4" /> },
    READY: { label: 'Ready', icon: <CookingPot className="h-4 w-4" /> },
    DELIVERED: { label: 'Delivered', icon: <CheckCircle2 className="h-4 w-4" /> },
    CANCELLED: { label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> },
};


function KOTCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
    const statusDisplay = statusDisplayMap[order.status] || { label: order.status, icon: <Package className="h-4 w-4" /> };

    return (
        <Card className="w-80 flex-shrink-0 flex flex-col shadow-lg bg-card rounded-lg">
            <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                <div className="flex justify-between items-baseline">
                    <CardTitle className="text-2xl font-bold">#{order.daily_order_id || order.id.slice(0, 5)}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">
                        {new Date(order.orderDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <p className="text-sm font-medium">{order.userName}</p>
                 <p className="text-xs text-muted-foreground pt-1">
                    {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                </p>
            </CardHeader>
            <CardContent className="p-4 flex-grow overflow-y-auto">
                <ul className="space-y-2">
                    {order.items.map((item, index) => (
                        <li key={item.uuid || index} className="flex text-base items-center">
                            <span className="w-8 text-center font-bold">{item.quantity}x</span>
                            <span className="flex-1 font-semibold">{item.name}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-3 border-t flex flex-col items-stretch gap-2">
                 <Badge 
                    variant={order.status === 'READY' ? 'default' : 'secondary'}
                    className={cn('font-semibold text-sm w-full justify-center py-1.5', {
                        'bg-yellow-500 text-white': order.status === 'READY',
                        'bg-blue-500 text-white': order.status === 'PENDING',
                    })}
                >
                    {statusDisplay.icon}
                    <span className="ml-2">{statusDisplay.label}</span>
                </Badge>
                {order.status === 'PENDING' && (
                    <div className="flex w-full gap-2">
                        <Button size="sm" variant="destructive" className="w-full" onClick={() => onUpdateStatus(order.id, 'CANCELLED')}>Cancel</Button>
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => onUpdateStatus(order.id, 'READY')}>Mark as Ready</Button>
                    </div>
                )}
                {order.status === 'READY' && (
                    <div className="w-full">
                      <Button size="sm" className="w-full" onClick={() => onUpdateStatus(order.id, 'DELIVERED')}>Mark Delivered</Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

function ArchivedOrderCard({ order }: { order: Order }) {
    const statusDisplay = statusDisplayMap[order.status] || { label: order.status, icon: <Package className="h-4 w-4" /> };

    return (
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-lg font-bold">Order #{order.daily_order_id || order.id.slice(0, 7)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.userName}</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-bold">₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <ul className="text-sm text-muted-foreground">
                    {order.items.slice(0, 3).map(item => (
                        <li key={item.uuid} className="flex justify-between py-0.5">
                            <span>{item.quantity} x {item.name}</span>
                        </li>
                    ))}
                    {order.items.length > 3 && (
                        <li>...and {order.items.length - 3} more</li>
                    )}
                </ul>
            </CardContent>
             <CardFooter>
                 <Badge 
                    variant={order.status === 'DELIVERED' ? 'default' : order.status === 'CANCELLED' ? 'destructive' : 'secondary'}
                    className={cn('font-semibold', {
                        'bg-green-600 text-white': order.status === 'DELIVERED',
                    })}
                >
                    {statusDisplay.icon}
                    <span className="ml-2">{statusDisplay.label}</span>
                </Badge>
            </CardFooter>
        </Card>
    );
}

function AdminDashboard({ supabase }: { supabase: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formatOrderFromDb = useCallback((dbOrder: any): Order => {
    return {
      id: dbOrder.id,
      daily_order_id: dbOrder.daily_order_id,
      userId: dbOrder.user_id,
      userName: dbOrder.user_name,
      orderDate: dbOrder.order_date,
      totalAmount: dbOrder.total_amount,
      status: dbOrder.status,
      items: dbOrder.order_items?.map((item: any) => ({
        id: item.menu_item_uuid,
        uuid: item.menu_item_uuid,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })) || [],
      pickup_notified_at: dbOrder.pickup_notified_at,
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('order_date', { ascending: false });

    if (error) {
        console.error("Error fetching orders:", error);
        toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } else {
        setOrders(data.map(formatOrderFromDb));
    }
    setIsLoading(false);
  }, [supabase, toast, formatOrderFromDb]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
      (payload) => {
          console.log('Realtime change received!', payload);
          fetchOrders();
      })
      .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };

  }, [fetchOrders, supabase]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const originalOrders = orders;
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        toast({ title: "Error", description: `Could not update order status. ${error.message}`, variant: "destructive" });
        setOrders(originalOrders);
    } else {
        toast({ title: "Success", description: `Order status updated.`});
    }
  };

  const liveOrders = useMemo(() => orders.filter(o => o.status === 'PENDING' || o.status === 'READY').sort((a,b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()), [orders]);
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'DELIVERED'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'CANCELLED'), [orders]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center flex-grow">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <Tabs defaultValue="live" className="w-full flex flex-col flex-grow">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live KOT ({liveOrders.length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-2 flex-grow">
            <div className="flex gap-4 overflow-x-auto p-4 bg-muted/40 rounded-lg h-full">
                {liveOrders.length > 0 ? (
                    liveOrders.map(order => <KOTCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />)
                ) : (
                    <div className="w-full flex items-center justify-center text-center py-16 text-muted-foreground">
                        <div>
                            <Package className="mx-auto h-12 w-12" />
                            <p className="mt-4">No live orders right now.</p>
                        </div>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="delivered" className="flex-grow overflow-y-auto pr-2">
             <div className="space-y-4">
                {deliveredOrders.length > 0 ? (
                     deliveredOrders.map(order => <ArchivedOrderCard key={order.id} order={order} />)
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No orders have been delivered yet.</p>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="cancelled" className="flex-grow overflow-y-auto pr-2">
             <div className="space-y-4">
                {cancelledOrders.length > 0 ? (
                     cancelledOrders.map(order => <ArchivedOrderCard key={order.id} order={order} />)
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No orders have been cancelled.</p>
                    </div>
                )}
            </div>
        </TabsContent>
    </Tabs>
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
            <header className="mb-6 flex justify-between items-center flex-shrink-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Admin Dashboard
                </h1>
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => router.push('/admin/analytics')}>
                        View Analytics
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </header>
            <AdminDashboard supabase={supabase} />
        </div>
    );
}

