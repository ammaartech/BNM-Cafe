"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, OrderItem } from "@/lib/types";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { useOrderStatus } from "@/context/OrderStatusContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  Package,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type OrderStatus = "PENDING" | "READY" | "DELIVERED" | "CANCELLED";

type OrderStation = {
  id: string;
  order_id: string;
  station_id: string;
  status: "PENDING" | "READY";
};

/* ---------------- STATUS DISPLAY ---------------- */

const statusDisplayMap: {
    PENDING: { label: string; icon: React.ReactNode; className: string };
    READY: { label: string; icon: React.ReactNode; className: string };
    DELIVERED: { label: string; icon: React.ReactNode; className: string };
    CANCELLED: { label: string; icon: React.ReactNode; className: string };
  } = {
    PENDING: {
      label: "Pending",
      icon: <Clock className="h-5 w-5" />,
      className: "bg-blue-500 text-white",
    },
    READY: {
      label: "Ready for Pickup",
      icon: <CookingPot className="h-5 w-5" />,
      className: "bg-yellow-500 text-white",
    },
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
  
/* ---------------- HELPERS ---------------- */

function formatOrder(data: any): Order {
  return {
    id: data.id,
    display_order_id: data.display_order_id,
    userId: data.user_id,
    userName: data.user_name,
    orderDate: data.order_date,
    totalAmount: data.total_amount,
    status: data.status,
    pickup_notified_at: data.pickup_notified_at,
    items:
      data.order_items?.map((item: any) => ({
        id: item.menu_item_id,
        uuid: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })) ?? [],
  };
}

/* ---------------- PAGE ---------------- */

export default function OrderTicketPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const { fetchOrdersStatus } = useOrderStatus();

  const [order, setOrder] = useState<Order | null>(null);
  const [stationStatuses, setStationStatuses] = useState<OrderStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isManualFetching, setIsManualFetching] = useState(false);

  const prevDerivedStatusRef = useRef<OrderStatus | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------------- AUDIO ---------------- */

  useEffect(() => {
    audioRef.current = new Audio(
      "/notification-sound-effects-copyright-free_g2XT3kky.mp3"
    );
  }, []);

  /* ---------------- FETCH ORDER ---------------- */

  const fetchOrder = useCallback(async () => {
    if (!orderId || !user || !supabase) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
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

  /* ---------------- FETCH STATIONS ---------------- */

  const fetchStationStatuses = useCallback(async () => {
    if (!orderId || !supabase) return;

    const { data } = await supabase
      .from("order_stations")
      .select("*")
      .eq("order_id", orderId);

    if (data) setStationStatuses(data as OrderStation[]);
  }, [orderId, supabase]);

  /* ---------------- DERIVED STATUS ---------------- */

  const derivedStatus: OrderStatus = (() => {
    if (!order) return "PENDING";
    if (order.status === "CANCELLED") return "CANCELLED";
    if (order.status === "DELIVERED") return "DELIVERED";

    if (
      stationStatuses.length > 0 &&
      stationStatuses.every((s) => s.status === "READY")
    ) {
      return "READY";
    }

    return "PENDING";
  })();

  /* ---------------- SIDE EFFECTS ---------------- */

  useEffect(() => {
    if (!order || !user || !supabase) return;

    const prev = prevDerivedStatusRef.current;
    const next = derivedStatus;

    if (prev !== "READY" && next === "READY") {
      audioRef.current?.play().catch(() => {});
      toast({
        title: "👍 Your Order is Ready!",
        description: `Order #${order.display_order_id} can be picked up now.`,
        duration: 5000,
        className: "bg-yellow-500 text-white border-yellow-500",
      });

      supabase
        .from("orders")
        .update({ pickup_notified_at: new Date().toISOString() })
        .eq("id", order.id)
        .then(() => fetchOrdersStatus(user.id));
    }

    prevDerivedStatusRef.current = next;
  }, [derivedStatus, order, supabase, toast, user, fetchOrdersStatus]);

  /* ---------------- REALTIME ---------------- */

  useEffect(() => {
    if (!user || !orderId || !supabase) return;

    let orderChannel: RealtimeChannel | null = null;
    let stationChannel: RealtimeChannel | null = null;

    fetchOrder();
    fetchStationStatuses();

    orderChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) =>
            prev && payload.new ? { ...prev, ...payload.new } : prev
          );
        }
      )
      .subscribe();

    stationChannel = supabase
      .channel(`order-stations-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_stations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as OrderStation;

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
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (stationChannel) supabase.removeChannel(stationChannel);
    };
  }, [orderId, supabase, user, fetchOrder, fetchStationStatuses]);

  /* ---------------- UI ---------------- */

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Order not found</AlertTitle>
      </Alert>
    );
  }

  const statusUI = statusDisplayMap[derivedStatus];

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/menu")}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Your Order</h1>
      </div>

      <Card className="max-w-md mx-auto shadow-2xl rounded-2xl">
        <CardContent className="p-0">
          <div className="text-center p-8">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <h2 className="text-6xl font-bold">{order.display_order_id}</h2>
          </div>

          <div
            className={cn(
              "flex items-center justify-center gap-3 p-4 text-lg font-bold",
              statusUI.className
            )}
          >
            {statusUI.icon}
            <span>{statusUI.label}</span>
          </div>

          <div className="p-6 space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-5 w-5" /> Items
            </h3>
            {order.items.map((item: OrderItem) => (
              <div key={item.uuid} className="flex justify-between">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>₹{(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />
        </CardContent>

        <CardFooter>
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              setIsManualFetching(true);
              await fetchOrder();
              await fetchStationStatuses();
              setIsManualFetching(false);
            }}
            disabled={isManualFetching}
          >
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
