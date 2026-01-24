
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  Order as BaseOrder,
  OrderItem as BaseOrderItem,
  OrderStatus,
} from "@/lib/types";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { useOrderStatus } from "@/context/OrderStatusContext";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  CookingPot,
  XCircle,
  Package,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type OrderStationStatus = "PENDING" | "READY" | "PICKED_UP";

type OrderStation = {
  id: string;
  order_id: string;
  station_id: string;
  status: OrderStationStatus;
};

interface OrderItem extends BaseOrderItem {
  station: { id: string; name: string } | null;
}

interface DetailedOrder extends Omit<BaseOrder, "items"> {
  items: OrderItem[];
}

/* ---------------- STATUS DISPLAY ---------------- */

const overallStatusDisplayMap: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="h-5 w-5" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  READY: {
    label: "Partially Ready",
    icon: <CookingPot className="h-5 w-5" />,
    className: "bg-yellow-400/10 text-yellow-700 border-yellow-400/20",
  },
  DELIVERED: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-5 w-5" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <XCircle className="h-5 w-5" />,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  COOKING: { // Fallback
    label: "Cooking",
    icon: <CookingPot className="h-5 w-5" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  PICKED_UP: { // Fallback
    label: "Picked Up",
    icon: <ShoppingBag className="h-5 w-5" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  }
};

const stationStatusDisplayMap: Record<
  OrderStationStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  READY: {
    label: "Ready for Pickup",
    icon: <CookingPot className="h-4 w-4" />,
    className: "bg-yellow-400/10 text-yellow-700 border-yellow-400/20",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
};

/* ---------------- SKELETON ---------------- */

function OrderTicketSkeleton() {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                <div className="w-full flex justify-between text-sm">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardFooter>
        </Card>
      </div>
    );
}


/* ---------------- PAGE ---------------- */

export default function OrderTicketPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const { fetchOrdersStatus } = useOrderStatus();

  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [stationStatuses, setStationStatuses] = useState<OrderStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------------- AUDIO ---------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio("/notification-sound-effects-copyright-free_g2XT3kky.mp3");
    }
  }, []);

  /* ---------------- FETCHING ---------------- */
  const fetchOrder = useCallback(async () => {
    if (!orderId || !user || !supabase) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_items(id, name, stations(id, name)))")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      setError("Failed to load order details.");
      setOrder(null);
    } else if (data) {
      setOrder({
        ...data,
        userId: data.user_id,
        userName: data.user_name,
        orderDate: data.order_date,
        totalAmount: data.total_amount,
        items:
          data.order_items?.map((item: any) => ({
            id: item.menu_items?.id,
            uuid: item.id, 
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            station: item.menu_items?.stations
              ? {
                  id: item.menu_items.stations.id,
                  name: item.menu_items.stations.name,
                }
              : null,
          })) ?? [],
      });
      setError(null);
    }
    setIsLoading(false);
  }, [orderId, user, supabase]);

  const fetchStationStatuses = useCallback(async () => {
    if (!orderId || !supabase) return;
    const { data } = await supabase
      .from("order_stations")
      .select("*")
      .eq("order_id", orderId);

    if (data) setStationStatuses(data as OrderStation[]);
  }, [orderId, supabase]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    if (!user || !orderId || !supabase) return;

    fetchOrder();
    fetchStationStatuses();
    
    // Listen for main order status changes (e.g. DELIVERED, CANCELLED)
    const orderChannel: RealtimeChannel = supabase.channel(`order-updates-${orderId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}`},
            (payload) => {
                setOrder(prev => prev ? { ...prev, ...payload.new } : null);
            }
        ).subscribe();

    // Listen for individual station status changes
    const stationChannel: RealtimeChannel = supabase
      .channel(`order-stations-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_stations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<OrderStation>) => {
            const updated = payload.new as OrderStation;
            
            setStationStatuses((prev) => {
                const prevStatuses = [...prev];
                const idx = prevStatuses.findIndex((s) => s.id === updated.id);
                
                // Play sound if a new station becomes 'READY'
                if (idx !== -1 && prevStatuses[idx].status !== 'READY' && updated.status === 'READY') {
                  audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
                  fetchOrdersStatus(user.id);
                }

                if (idx === -1) return [...prev, updated];
                prevStatuses[idx] = updated;
                return prevStatuses;
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(stationChannel);
    };
  }, [orderId, supabase, user, fetchOrder, fetchStationStatuses, fetchOrdersStatus]);
  
  /* ---------------- UI LOGIC ---------------- */
  
  const itemsByStation = useMemo(() => {
    if (!order?.items) return new Map();

    return order.items.reduce((acc, item) => {
      const stationId = item.station?.id ?? "unknown";
      const stationName = item.station?.name ?? "Miscellaneous";

      if (!acc.has(stationId)) {
        acc.set(stationId, { stationName, items: [] });
      }
      acc.get(stationId)!.items.push(item);
      return acc;
    }, new Map<string, { stationName: string; items: OrderItem[] }>());

  }, [order?.items]);

  const overallStatusInfo = order ? overallStatusDisplayMap[order.status] : null;

  /* ---------------- RENDER ---------------- */

  if (isLoading) return <OrderTicketSkeleton />;
  if (error) return (
    <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    </div>
  );
  if (!order) return (
    <div className="flex h-full items-center justify-center p-4">
        <Alert className="max-w-md">
            <Package className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>The requested order could not be found.</AlertDescription>
        </Alert>
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Your Order</h1>
      </div>

      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Order #{order.display_order_id}</CardTitle>
                {overallStatusInfo && (
                    <Badge variant="outline" className={cn("text-base", overallStatusInfo.className)}>
                        {overallStatusInfo.icon}
                        <span className="ml-2">{overallStatusInfo.label}</span>
                    </Badge>
                )}
            </div>
        </CardHeader>

        <CardContent className="space-y-4">
            <Separator />
            {Array.from(itemsByStation.entries()).map(([stationId, { stationName, items }]) => {
                const stationStatus = stationStatuses.find(s => s.station_id === stationId)?.status ?? 'PENDING';
                const statusInfo = stationStatusDisplayMap[stationStatus];

                return (
                    <div key={stationId}>
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-semibold text-lg">{stationName}</h3>
                             <Badge variant="outline" className={cn("font-semibold", statusInfo.className)}>
                                 {statusInfo.icon}
                                 <span className="ml-2">{statusInfo.label}</span>
                             </Badge>
                        </div>
                        <ul className="space-y-1 text-muted-foreground">
                            {items.map(item => (
                                <li key={item.uuid} className="flex justify-between">
                                    <span>{item.quantity} x {item.name}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            })}
        </CardContent>

        <CardFooter className="flex-col items-stretch space-y-2 pt-4">
            <Separator />
            <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground pt-2 text-center">
                Ordered on {format(new Date(order.orderDate), "MMM dd, yyyy 'at' hh:mm a")}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
