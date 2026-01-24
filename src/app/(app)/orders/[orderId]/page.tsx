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

import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  CookingPot,
  XCircle,
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

const overallStatusDisplayMap: Partial<
  Record<OrderStatus, { label: string; icon: React.ReactNode; className: string }>
> = {
  DELIVERED: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-5 w-5" />,
    className: "bg-green-600 text-white",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <XCircle className="h-5 w-5" />,
    className: "bg-destructive text-destructive-foreground",
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
  const [isManualFetching, setIsManualFetching] = useState(false);

  const prevStationStatusesRef = useRef<OrderStation[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------------- AUDIO ---------------- */

  useEffect(() => {
    audioRef.current = new Audio(
      "/notification-sound-effects-copyright-free_g2XT3kky.mp3"
    );
  }, []);

  /* ---------------- FETCHING ---------------- */

  const fetchOrder = useCallback(async () => {
    if (!orderId || !user || !supabase) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_items(stations(id, name)))")
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
            id: item.menu_item_id,
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

          // 🔑 TYPE GUARD (FIXES ALL 3 ERRORS)
          if (!updated || typeof updated !== "object" || !("id" in updated)) {
            return;
          }

          setStationStatuses((prev): OrderStation[] => {
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

  /* ---------------- UI ---------------- */

  if (isLoading)
    return (
      <Card className="max-w-md mx-auto p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );

  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  if (!order)
    return (
      <Alert variant="destructive">
        <AlertTitle>Order not found</AlertTitle>
      </Alert>
    );

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Your Order</h1>
      </div>

      {/* UI unchanged */}
    </>
  );
}
