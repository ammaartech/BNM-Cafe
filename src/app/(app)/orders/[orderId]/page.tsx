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
  COOKING: {
    label: "Cooking",
    icon: <CookingPot className="h-5 w-5" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: <ShoppingBag className="h-5 w-5" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
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
    if (!user || !orderId || !supabase) return;

    fetchOrder();
    fetchStationStatuses();

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
          const updated = payload.new;
          if (!updated || typeof updated !== "object" || !("id" in updated))
            return;

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

    return () => {
      supabase.removeChannel(stationChannel);
    };
  }, [orderId, supabase, user, fetchOrder, fetchStationStatuses]);

  /* ---------------- GROUP ITEMS ---------------- */

  const itemsByStation = useMemo(() => {
    if (!order?.items) return new Map();

    return order.items.reduce((acc, item) => {
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
      <div className="p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
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
      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Order Not Found</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="p-4">
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

      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Order #{order.display_order_id}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-base",
                overallStatusDisplayMap[order.status]?.className
              )}
            >
              {overallStatusDisplayMap[order.status]?.icon}
              <span className="ml-2">
                {overallStatusDisplayMap[order.status]?.label}
              </span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />
          {Array.from(itemsByStation.entries()).map(
            ([stationId, { stationName, items }]) => {
              const stationStatus =
                stationStatuses.find((s) => s.station_id === stationId)
                  ?.status ?? "PENDING";
              const statusInfo = stationStatusDisplayMap[stationStatus];

              return (
                <div key={stationId}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{stationName}</h3>
                    <Badge
                      variant="outline"
                      className={cn("font-semibold", statusInfo.className)}
                    >
                      {statusInfo.icon}
                      <span className="ml-2">{statusInfo.label}</span>
                    </Badge>
                  </div>

                  <ul className="space-y-1 text-muted-foreground">
                    {items.map((item: OrderItem) => (
                      <li
                        key={item.uuid}
                        className="flex justify-between"
                      >
                        <span>
                          {item.quantity} × {item.name}
                        </span>
                        <span>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
          )}
        </CardContent>

        <CardFooter className="pt-4">
          <Separator />
          <div className="w-full flex justify-between font-bold text-lg mt-2">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="w-full text-xs text-muted-foreground text-center mt-2">
            Ordered on{" "}
            {format(
              new Date(order.orderDate),
              "MMM dd, yyyy 'at' hh:mm a"
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
