
"use client";

import { useParams, useRouter } from "next/navigation";
import type { Order, OrderItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, ShoppingBag, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

function TicketSkeleton() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                     <div>
                        <Skeleton className="h-4 w-12 mb-2" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                </div>
                 <Separator />

                <div>
                     <Skeleton className="h-5 w-24 mb-4" />
                     <div className="space-y-4">
                        <div className="flex justify-between items-center"><Skeleton className="h-5 w-40" /> <Skeleton className="h-5 w-16" /></div>
                        <div className="flex justify-between items-center"><Skeleton className="h-5 w-32" /> <Skeleton className="h-5 w-16" /></div>
                     </div>
                </div>

                <Separator />
                 <div className="flex justify-end">
                    <div className="w-1/2 space-y-3">
                         <div className="flex justify-between"><Skeleton className="h-4 w-20" /> <Skeleton className="h-4 w-16" /></div>
                         <div className="flex justify-between"><Skeleton className="h-4 w-24" /> <Skeleton className="h-4 w-12" /></div>
                         <div className="flex justify-between"><Skeleton className="h-5 w-16" /> <Skeleton className="h-5 w-20" /></div>
                    </div>
                 </div>

            </CardContent>
        </Card>
    );
}

function formatOrder(data: any): Order {
    return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        orderDate: data.order_date,
        totalAmount: data.total_amount,
        status: data.status,
        items: data.order_items?.map((item: any) => ({
            id: item.menu_item_id,
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

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const previousStatusRef = useRef<Order['status'] | null>(null);

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
    } else {
        setOrder(formatOrder(data));
        setError(null);
    }
    setIsLoading(false);
  }, [orderId, user, supabase]);


  const handleOrderUpdate = useCallback((payload: any) => {
    const newRecord = payload.new;
    if (newRecord) {
        setOrder(currentOrder => {
            // Avoid reverting to an older state if a full fetch just happened
            if (currentOrder && new Date(currentOrder.orderDate) > new Date(newRecord.order_date)) {
                return currentOrder;
            }
            // Update only the status from the realtime event
            return { ...currentOrder!, status: newRecord.status };
        });
    }
  }, []);

  // This effect handles showing notifications on status change
  useEffect(() => {
    if (!order || !supabase) {
        // If order is not loaded, do nothing.
        // Also update previous status ref on initial load.
        if (order) previousStatusRef.current = order.status;
        return;
    }

    // Handle "Ready for Pickup" notification with the new DB flag logic
    if (order.status === 'Ready for Pickup' && !order.pickup_notified_at) {
        toast({
            title: "👍 Your Order is Ready!",
            description: `Order #${order.id.slice(0, 7)} can be picked up now.`,
            duration: 5000,
            className: "bg-accent text-accent-foreground border-accent",
        });
        
        // Mark as notified in the database. Fire-and-forget.
        const markAsNotified = async () => {
             await supabase
                .from('orders')
                .update({ pickup_notified_at: new Date().toISOString() })
                .eq('id', order.id);
        };
        markAsNotified();

        // Optimistically update local state to prevent re-triggering before a refetch
        setOrder(currentOrder => currentOrder ? { ...currentOrder, pickup_notified_at: new Date().toISOString() } : null);
    }
    
    // Handle other notifications using the previous state ref logic
    if (previousStatusRef.current && order.status !== previousStatusRef.current) {
        const newStatus = order.status;
        // The ready for pickup is handled above, so we can exclude it here.
        if (newStatus === 'Delivered') {
            toast({
                title: "✅ Order Delivered!",
                description: `Enjoy your meal!`,
                duration: 5000,
            });
          } else if (newStatus === 'Cancelled') {
             toast({
                title: "❌ Order Cancelled",
                description: `Your order has been cancelled.`,
                variant: "destructive",
                duration: 5000,
            });
          }
    }
    
    // Always update the ref to the latest status after checking
    previousStatusRef.current = order.status;

  }, [order, supabase, toast]);


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
            console.log('Subscribed to order ticket updates!');
          }
          if (err) {
            console.error('Subscription error:', err);
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

    fetchOrder(); // Initial fetch
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

  const subtotal = order.totalAmount / 1.05;
  const gst = order.totalAmount - subtotal;
  const total = order.totalAmount;


  return (
    <>
    <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Order Details</h1>
    </div>
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary"/>
            <div>
                <CardTitle className="text-2xl font-bold">Order Ticket</CardTitle>
                <CardDescription>Order #{order.id.slice(0, 7)}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <dl className="grid sm:grid-cols-3 gap-x-4 gap-y-6 text-sm">
             <div>
                <dt className="text-muted-foreground font-semibold">Name</dt>
                <dd className="mt-1 font-medium text-foreground">{order.userName || 'Anonymous'}</dd>
            </div>
             <div>
                <dt className="text-muted-foreground font-semibold">Status</dt>
                <dd className="mt-1">
                     <Badge 
                          variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                          className={cn('font-semibold', {
                              'bg-green-600 text-white': order.status === 'Delivered',
                              'bg-yellow-500 text-white': order.status === 'Ready for Pickup',
                          })}
                        >
                            {order.status}
                        </Badge>
                </dd>
            </div>
            <div>
                <dt className="text-muted-foreground font-semibold">Total</dt>
                <dd className="mt-1 font-bold text-lg text-primary">₹{total.toFixed(2)}</dd>
            </div>
        </dl>

        <Separator />

        <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="h-5 w-5"/>Items</h3>
            <ul className="space-y-3">
                {order.items.map((item: OrderItem, index: number) => (
                    <li key={index} className="flex justify-between items-baseline">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {item.quantity} x ₹{item.price.toFixed(2)}
                            </p>
                        </div>
                        <p className="font-medium">₹{(item.quantity * item.price).toFixed(2)}</p>
                    </li>
                ))}
            </ul>
        </div>
        
        <Separator />

        <div className="flex justify-end">
            <div className="w-full sm:w-1/2 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span className="font-medium">₹{gst.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
