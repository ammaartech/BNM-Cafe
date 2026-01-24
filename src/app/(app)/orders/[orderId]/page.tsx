
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
    icon: <Clock className="h-4 w-4" />,
    className: "bg-blue-500 text-primary-foreground border-transparent",
  },
  READY: {
    label: "Ready for Pickup",
    icon: <Package className="h-4 w-4" />,
    className: "bg-yellow-500 text-primary-foreground border-transparent",
  },
  DELIVERED: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "bg-green-600 text-primary-foreground border-transparent",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-destructive text-destructive-foreground border-transparent",
  },
  COOKING: {
    label: "Cooking",
    icon: <CookingPot className="h-4 w-4" />,
    className: "bg-blue-500 text-primary-foreground border-transparent",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: <ShoppingBag className="h-4 w-4" />,
    className: "bg-green-600 text-primary-foreground border-transparent",
  },
};

const stationStatusDisplayMap: Record<
  OrderStationStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    className: "bg-blue-500 text-primary-foreground border-transparent",
  },
  READY: {
    label: "Ready for Pickup",
    icon: <CookingPot className="h-4 w-4" />,
    className: "bg-yellow-500 text-primary-foreground border-transparent",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "bg-green-600 text-primary-foreground border-transparent",
  },
};

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
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "/notification-sound-effects-copyright-free_g2XT3kky.mp3"
      );
    }
  }, []);

  /* ---------------- FETCH ORDER ---------------- */

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
        id: data.id, // ensure id is present
        userId: data.user_id,
        userName: data.user_name,
        orderDate: data.order_date,
        totalAmount: data.total_amount,
        items:
          data.order_items?.map((item: any): OrderItem => ({
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
    if (!orderId || !user || !supabase) return;

    fetchOrder();
    fetchStationStatuses();

    const stationChannel: RealtimeChannel = supabase
      .channel(`order-stations-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_stations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<OrderStation>) => {
          const updated = payload.new;
          if (!updated || typeof updated !== 'object' || !('id' in updated)) return;
          
          setStationStatuses((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx === -1) return [...prev, updated];
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          });
        }
      )
      .subscribe();
      
    const orderChannel: RealtimeChannel = supabase
      .channel(`order-status-realtime-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: RealtimePostgresChangesPayload<BaseOrder>) => {
          if (payload.new && payload.old) {
            setOrder((prevOrder) => {
              if (!prevOrder) return null;
              // Safely merge new data without overwriting items array
              return { ...prevOrder, ...payload.new };
            });
             if (
                ('status' in payload.old && 'status' in payload.new) &&
                payload.old.status !== 'READY' &&
                payload.new.status === 'READY'
              ) {
                toast({ title: 'Your order is ready for pickup!' });
                audioRef.current?.play().catch(console.error);
                fetchOrdersStatus(user.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stationChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [orderId, supabase, user, fetchOrder, fetchStationStatuses, toast, fetchOrdersStatus]);


  /* ---------------- GROUP ITEMS ---------------- */

  const itemsByStation = useMemo(() => {
    if (!order?.items) return new Map();

    return order.items.reduce((acc: Map<string, { stationName: string; items: OrderItem[] }>, item: OrderItem) => {
      const stationId = item.station?.id ?? "unknown";
      const stationName = item.station?.name ?? "Miscellaneous";

      if (!acc.has(stationId)) {
        acc.set(stationId, { stationName, items: [] as OrderItem[] });
      }

      acc.get(stationId)!.items.push(item);
      return acc;
    }, new Map<string, { stationName: string; items: OrderItem[] }>());
  }, [order?.items]);

  /* ---------------- RENDER ---------------- */

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Card className="max-w-md mx-auto shadow-lg w-full">
            <CardHeader><Skeleton className="h-8 w-full" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Alert className="max-w-sm">
            <Package className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>We couldn't find the details for this order.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const overallStatusInfo = overallStatusDisplayMap[order.status];

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Your Order</h1>
      </div>

      <Card className="max-w-md mx-auto shadow-lg rounded-2xl w-full flex-grow flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Order #{order.display_order_id}
            </CardTitle>
            {overallStatusInfo && (
                <Badge
                variant="outline"
                className={cn(
                    "text-sm font-semibold",
                    overallStatusInfo.className
                )}
                >
                {overallStatusInfo.icon}
                <span className="ml-2">{overallStatusInfo.label}</span>
                </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-4 flex-grow">
          <Separator />
          {Array.from(itemsByStation.entries()).map(
            ([stationId, { stationName, items }]) => {
              const stationStatus =
                stationStatuses.find((s) => s.station_id === stationId)
                  ?.status ?? 'PENDING';
              const statusInfo = stationStatusDisplayMap[stationStatus];

              const stationTotal = items.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              );

              return (
                 <div key={stationId} className="flex justify-between items-start pt-2">
                    <div className="grid gap-1">
                      <h3 className="font-semibold text-md">{stationName}</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {items.map((item: OrderItem) => (
                          <li key={item.uuid}>{item.quantity} × {item.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right grid gap-2 items-center">
                        {statusInfo &&
                            <Badge variant="outline" className={cn('font-semibold justify-self-end w-fit', statusInfo.className)}>
                            {statusInfo.icon}
                            <span className="ml-1.5 text-xs">{statusInfo.label}</span>
                            </Badge>
                        }
                        <p className="font-semibold text-muted-foreground text-sm">₹{stationTotal.toFixed(2)}</p>
                    </div>
                  </div>
              );
            }
          )}
        </CardContent>

        <CardFooter className="flex-col items-start gap-2 mt-auto pt-4">
          <Separator className="w-full" />
          <div className="w-full flex justify-between font-bold text-xl mt-2">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="w-full text-center text-xs text-muted-foreground pt-2">
            Ordered on{' '}
            {format(new Date(order.orderDate), "MMM dd, yyyy 'at' hh:mm a")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
