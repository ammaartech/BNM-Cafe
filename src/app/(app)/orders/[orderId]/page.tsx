"use client";

import { useParams, useRouter } from "next/navigation";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useOrderStatus } from "@/context/OrderStatusContext";

/* ---------------- STATUS MAP ---------------- */

const statusDisplayMap: {
  [key in OrderStatus]?: {
    label: string;
    icon: React.ReactNode;
    className: string;
  };
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

/* ---------------- SKELETON ---------------- */

function TicketSkeleton() {
  return (
    <Card className="max-w-md mx-auto shadow-lg w-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/* ---------------- FORMATTER ---------------- */

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
      })) || [],
  };
}

/* ================= PAGE ================= */

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

  const previousStatusRef = useRef<Order["status"] | null>(null);
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
      const formatted = formatOrder(data);
      setOrder(formatted);
      previousStatusRef.current = formatted.status; // 🔥 CRITICAL FIX
      setError(null);
    }

    setIsLoading(false);
  }, [orderId, user, supabase]);

  /* ---------------- REALTIME HANDLER ---------------- */

  const handleOrderUpdate = useCallback((payload: any) => {
    console.log("[Realtime] Update received:", payload.new);

    setOrder((current) => {
      if (!current || !payload.new) return current;

      // Prevent loop on pickup_notified_at update
      if (
        payload.old?.pickup_notified_at &&
        payload.new?.pickup_notified_at
      ) {
        return current;
      }

      return {
        ...current,
        ...payload.new,
      };
    });
  }, []);

  /* ---------------- STATUS SIDE EFFECTS ---------------- */

  useEffect(() => {
    if (!order || !user || !supabase) return;

    const prev = previousStatusRef.current;
    const next = order.status;

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

    if (prev && prev !== next) {
      if (next === "DELIVERED") {
        toast({ title: "✅ Order Delivered!", duration: 5000 });
        fetchOrdersStatus(user.id);
      }
      if (next === "CANCELLED") {
        toast({
          title: "❌ Order Cancelled",
          variant: "destructive",
          duration: 5000,
        });
        fetchOrdersStatus(user.id);
      }
    }

    previousStatusRef.current = next;
  }, [order, supabase, toast, user, fetchOrdersStatus]);

  /* ---------------- REALTIME SUBSCRIPTION ---------------- */

  useEffect(() => {
    if (!user || !orderId || !supabase) return;

    let channel: RealtimeChannel | null = null;

    const subscribe = () => {
      if (channel) return;

      channel = supabase
        .channel(`order-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          handleOrderUpdate
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[Realtime] Subscribed");
          }
        });
    };

    const unsubscribe = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    fetchOrder();
    subscribe();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        fetchOrder();
        subscribe();
      } else {
        unsubscribe();
      }
    });

    return () => unsubscribe();
  }, [orderId, supabase, user, handleOrderUpdate, fetchOrder]);

  /* ---------------- UI ---------------- */

  if (isLoading) return <TicketSkeleton />;

  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  if (!order)
    return (
      <Alert variant="destructive">
        <AlertTitle>Order not found</AlertTitle>
      </Alert>
    );

  const statusUI =
    statusDisplayMap[order.status] ??
    { label: order.status, icon: <Package />, className: "" };

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
            <h2 className="text-6xl font-bold">
              {order.display_order_id}
            </h2>
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
            {order.items.map((item) => (
              <div key={item.uuid} className="flex justify-between">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>₹{(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              setIsManualFetching(true);
              await fetchOrder();
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