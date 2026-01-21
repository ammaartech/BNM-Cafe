
"use client";

import { useParams, useRouter } from "next/navigation";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ShoppingBag, ArrowLeft, RefreshCw, Loader2, CheckCircle2, Clock, CookingPot, XCircle, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useOrderStatus } from "@/context/OrderStatusContext";

const statusDisplayMap: { [key in OrderStatus]?: { label: string; icon: React.ReactNode; className: string } } = {
    PENDING: { label: 'Pending', icon: <Clock className="h-5 w-5" />, className: 'bg-blue-500 text-white' },
    READY: { label: 'Ready for Pickup', icon: <CookingPot className="h-5 w-5" />, className: 'bg-yellow-500 text-white' },
    DELIVERED: { label: 'Delivered', icon: <CheckCircle2 className="h-5 w-5" />, className: 'bg-green-600 text-white' },
    CANCELLED: { label: 'Cancelled', icon: <XCircle className="h-5 w-5" />, className: 'bg-destructive text-destructive-foreground' },
};

function TicketSkeleton() {
    return (
        <>
        <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
        </div>
        <Card className="max-w-md mx-auto shadow-lg w-full">
            <CardContent className="p-0">
                <div className="text-center p-8 bg-muted/30 rounded-t-lg">
                    <Skeleton className="h-5 w-24 mx-auto mb-2" />
                    <Skeleton className="h-16 w-48 mx-auto" />
                    <Skeleton className="h-5 w-32 mx-auto mt-2" />
                    <Skeleton className="h-4 w-40 mx-auto mt-1" />
                </div>
                
                <div className="p-4">
                    <Skeleton className="h-12 w-full" />
                </div>

                <div className="p-6 space-y-4">
                     <Skeleton className="h-5 w-24 mb-4" />
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" /> 
                                <Skeleton className="h-4 w-20" /> 
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" /> 
                                <Skeleton className="h-4 w-16" /> 
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                     </div>
                </div>

                <Separator />
                 <div className="p-6">
                    <div className="w-full space-y-3">
                         <div className="flex justify-between"><Skeleton className="h-4 w-20" /> <Skeleton className="h-4 w-16" /></div>
                         <div className="flex justify-between"><Skeleton className="h-4 w-24" /> <Skeleton className="h-4 w-12" /></div>
                         <div className="flex justify-between mt-3 pt-3 border-t"><Skeleton className="h-6 w-16" /> <Skeleton className="h-6 w-20" /></div>
                    </div>
                 </div>
            </CardContent>
            <CardFooter className="p-3 bg-muted/30 rounded-b-lg border-t">
                <Skeleton className="h-8 w-full" />
            </CardFooter>
        </Card>
        </>
    );
}

function formatOrder(data: any): Order {
    return {
        id: data.id,
        display_order_id: data.display_order_id,
        userId: data.user_id,
        userName: data.user_name,
        orderDate: data.order_date,
        totalAmount: data.total_amount,
        status: data.status,
        items: data.order_items?.map((item: any) => ({
            id: item.menu_item_id,
            uuid: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })) || [],
        pickup_notified_at: data.pickup_notified_at,
    };
}


export default function OrderTicketPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const { fetchOrdersStatus } = useOrderStatus();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isManualFetching, setIsManualFetching] = useState(false);
  const previousStatusRef = useRef<Order['status'] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio('/notification-sound-effects-copyright-free_g2XT3kky.mp3');
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !user || !supabase) return;
    
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

    if (error) {
        setError(error);
        setOrder(null);
    } else if (data) {
        setOrder(formatOrder(data));
        setError(null);
    }
    setIsLoading(false);
  }, [orderId, user, supabase]);


  const handleOrderUpdate = useCallback((payload: any) => {
    console.log('[Realtime] Payload received:', payload);
    const newRecord = payload.new;
    setOrder(currentOrder => {
        if (!currentOrder || !newRecord) {
            console.log('[Realtime] Skipping update: no current order or payload.');
            return currentOrder;
        }
        console.log('[Realtime] Updating order state...');
        return {
            ...currentOrder,
            status: newRecord.status,
            pickup_notified_at: newRecord.pickup_notified_at,
            display_order_id: newRecord.display_order_id,
        };
    });
  }, []);

  const handleManualRefreshClick = async () => {
      setIsManualFetching(true);
      await fetchOrder();
      setIsManualFetching(false);
  }

  useEffect(() => {
    if (!order || !supabase || !user) {
        if (order) previousStatusRef.current = order.status;
        return;
    }

    const newStatus = order.status;
    const prevStatus = previousStatusRef.current;

    if (prevStatus && prevStatus !== 'READY' && newStatus === 'READY') {
      audioRef.current?.play().catch(error => {
          console.warn("Audio playback failed. User may need to interact with the page first.", error);
      });
    }

    if (order.status === 'READY' && !order.pickup_notified_at) {
        toast({
            title: "👍 Your Order is Ready!",
            description: `Order #${order.display_order_id || '...'} can be picked up now.`,
            duration: 5000,
            className: "bg-yellow-500 text-white border-yellow-500",
        });
        
        const markAsNotified = async () => {
             const { error } = await supabase
                .from('orders')
                .update({ pickup_notified_at: new Date().toISOString() })
                .eq('id', order.id);
            
            if (!error) {
                fetchOrdersStatus(user.id);
            }
        };
        markAsNotified();

        setOrder(currentOrder => currentOrder ? { ...currentOrder, pickup_notified_at: new Date().toISOString() } : null);
    }
    
    if (prevStatus && order.status !== prevStatus) {
        if (newStatus === 'DELIVERED') {
            toast({
                title: "✅ Order Delivered!",
                description: `Enjoy your meal!`,
                duration: 5000,
            });
            fetchOrdersStatus(user.id);
          } else if (newStatus === 'CANCELLED') {
             toast({
                title: "❌ Order Cancelled",
                description: `Your order has been cancelled.`,
                variant: "destructive",
                duration: 5000,
            });
            fetchOrdersStatus(user.id);
          }
    }
    
    previousStatusRef.current = order.status;

  }, [order, supabase, toast, user, fetchOrdersStatus]);


  useEffect(() => {
    if (!user || !orderId || !supabase) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      if (channel) return;
      channel = supabase
        .channel(`order-ticket-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          handleOrderUpdate
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to order ticket updates for ${orderId}!`);
          }
          if (err) {
            console.error('[Realtime] Subscription error:', err);
            toast({
              title: 'Connection Issue',
              description: 'Could not get real-time order updates.',
              variant: 'destructive',
            });
          }
        });
    };

    const teardownSubscription = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder();
        setupSubscription();
      } else {
        teardownSubscription();
      }
    };

    fetchOrder();
    setupSubscription();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      teardownSubscription();
    };
  }, [orderId, supabase, user, toast, handleOrderUpdate, fetchOrder]);


  if (isLoading) {
    return <TicketSkeleton />;
  }

  if (error) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message || "Failed to fetch order details."}</AlertDescription>
        </Alert>
    );
  }
  
  if (!order) {
     return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>The requested order could not be found.</AlertDescription>
        </Alert>
    );
  }

  const subtotal = order.totalAmount > 0 ? order.totalAmount / 1.05 : 0;
  const gst = order.totalAmount > 0 ? order.totalAmount - subtotal : 0;
  const total = order.totalAmount;
  const statusDisplay = statusDisplayMap[order.status] || { label: order.status, icon: <Package className="h-5 w-5" />, className: 'bg-muted text-muted-foreground' };


  return (
    <>
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push('/menu')}>
                <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold">Your Order</h1>
        </div>
        <Card className="max-w-md mx-auto shadow-2xl rounded-2xl w-full">
        <CardContent className="p-0">
            <div className="text-center p-8 bg-muted/30 rounded-t-2xl">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <h2 className="text-6xl font-bold tracking-tighter text-primary">
                    {order.display_order_id || '---'}
                </h2>
                <p className="text-muted-foreground mt-2">{order.userName}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(order.orderDate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    })}
                </p>
            </div>

            <div className={cn("flex items-center justify-center gap-3 p-4 text-lg font-bold", statusDisplay.className)}>
                {statusDisplay.icon}
                <span>{statusDisplay.label}</span>
            </div>

            <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground"><ShoppingBag className="h-5 w-5"/>Items</h3>
                <ul className="space-y-3">
                    {order.items.map((item: OrderItem, index: number) => (
                        <li key={item.uuid || index} className="flex justify-between items-baseline text-base">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.quantity} &times; ₹{item.price.toFixed(2)}
                                </p>
                            </div>
                            <p className="font-semibold text-foreground">₹{(item.quantity * item.price).toFixed(2)}</p>
                        </li>
                    ))}
                </ul>
            </div>
            
            <Separator />

            <div className="p-6">
                <div className="space-y-2 text-base">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (5%)</span>
                        <span className="font-medium">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-3 mt-3">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-3 bg-muted/30 rounded-b-2xl border-t">
            <Button variant="ghost" size="sm" onClick={handleManualRefreshClick} disabled={isManualFetching} className="w-full text-muted-foreground">
                {isManualFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Check for updates</span>
            </Button>
        </CardFooter>
        </Card>
    </>
  );
}

    
