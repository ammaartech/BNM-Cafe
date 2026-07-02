
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  Order as BaseOrder,
  OrderItem as BaseOrderItem,
  OrderStatus,
  OrderStationStatus,
} from "@/lib/types";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useOrderStatus } from "@/context/OrderStatusContext";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { format } from "date-fns";
import { motion } from "framer-motion";

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
  MessageSquare,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

// Local types to handle the nested data for this page
type OrderStation = { id: string; order_id: string; station_id: string; status: OrderStationStatus; };

interface OrderItem extends BaseOrderItem {
  station: { id: string; name: string; } | null;
}
interface DetailedOrder extends Omit<BaseOrder, "items"> {
  items: OrderItem[];
}

/* ---------------- STATUS DISPLAY ---------------- */

const overallStatusDisplayMap: {
  [key in OrderStatus]?: { label: string; icon: React.ReactNode; className: string };
} = {
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
    className: "bg-amber-100 text-amber-800 border-amber-200 font-semibold",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "bg-green-100/60 text-green-700 border-green-200/60 font-medium",
  },
};

/* ---------------- Slot Machine Char ---------------- */
const SlotChar = ({ char, index }: { char: string; index: number }) => {
  const isNumber = /[0-9]/.test(char);
  if (!isNumber) {
    return <span className="inline-block">{char}</span>;
  }

  // Base array of numbers for spinning
  const baseSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Repeat sequence so it spins for a bit before stopping. Later digits spin longer.
  const repeats = 2 + index;
  let sequence: number[] = [];
  for (let i = 0; i < repeats; i++) {
    sequence = [...sequence, ...baseSequence];
  }
  sequence.push(Number(char));

  return (
    <span className="inline-flex h-[1em] overflow-hidden align-bottom">
      <motion.span
        initial={{ y: 0 }}
        animate={{ y: `-${(sequence.length - 1) * 100}%` }}
        transition={{
          duration: 1.5 + index * 0.2, // staggered stop
          ease: [0.16, 1, 0.3, 1], // sweet deceleration curve
        }}
        className="flex flex-col leading-none items-center"
      >
        {sequence.map((num, i) => (
          <span key={i} className="h-[1em] flex items-center justify-center">
            {num}
          </span>
        ))}
      </motion.span>
    </span>
  );
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
    audioRef.current = new Audio("/notification-sound-effects-copyright-free_g2XT3kky.mp3");
  }, []);

  /* ---------------- DATA FETCHING ---------------- */
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
      const formattedOrder: DetailedOrder = {
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
              ? { id: item.menu_items.stations.id, name: item.menu_items.stations.name }
              : null,
          })) ?? [],
      };
      setOrder(formattedOrder);
      setError(null);
    }

    setIsLoading(false);
  }, [orderId, user, supabase]);

  const fetchStationStatuses = useCallback(async () => {
    if (!orderId || !supabase) return;
    const { data } = await supabase.from("order_stations").select("*").eq("order_id", orderId);
    if (data) setStationStatuses(data as OrderStation[]);
  }, [orderId, supabase]);

  /* ---------------- DATA GROUPING ---------------- */
  const groupedItemsByStation = useMemo(() => {
    if (!order?.items.length || !stationStatuses.length) return [];
    const stationMap = new Map<string, { stationName: string; stationId: string; items: OrderItem[] }>();

    for (const item of order.items) {
      const stationId = item.station?.id;
      const stationName = item.station?.name || 'General Items';
      if (!stationId) continue;

      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, { stationName, stationId, items: [] });
      }
      stationMap.get(stationId)!.items.push(item);
    }

    return Array.from(stationMap.values())
      .map((group) => {
        const stationInfo = stationStatuses.find((s) => s.station_id === group.stationId);
        return {
          ...group,
          status: stationInfo?.status || "PENDING",
        };
      })
      .sort((a, b) => a.stationName.localeCompare(b.stationName));
  }, [order, stationStatuses]);

  /* ---------------- SIDE EFFECTS & REALTIME ---------------- */

  useEffect(() => {
    if (!order || !user || !supabase) return;

    const prevStatuses = prevStationStatusesRef.current;
    stationStatuses.forEach((currentStation) => {
      const prevStation = prevStatuses.find((p) => p.id === currentStation.id);
      const readyGroup = groupedItemsByStation.find(g => g.stationId === currentStation.station_id);

      if (prevStation?.status === "PENDING" && currentStation.status === "READY" && readyGroup) {
        audioRef.current?.play().catch(() => { });
        toast({
          title: "👍 Items Ready for Pickup!",
          description: `Items from ${readyGroup.stationName} are now ready.`,
          duration: 5000,
          className: "bg-yellow-500 text-white border-yellow-500",
        });
        supabase.from("orders").update({ pickup_notified_at: new Date().toISOString() }).eq("id", order.id).then(() => fetchOrdersStatus(user.id));
      }
    });

    prevStationStatusesRef.current = stationStatuses;
  }, [stationStatuses, order, supabase, toast, user, fetchOrdersStatus, groupedItemsByStation]);

  useEffect(() => {
    if (!user || !orderId || !supabase) return;

    fetchOrder();
    fetchStationStatuses();

    const orderChannel: RealtimeChannel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => {
        fetchOrder(); // Re-fetch all order data on update
      })
      .subscribe();

    const stationChannel: RealtimeChannel = supabase
      .channel(`order-stations-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_stations", filter: `order_id=eq.${orderId}` },
        (payload: RealtimePostgresChangesPayload<OrderStation>) => {
          const updated = payload.new as OrderStation;
          setStationStatuses((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx === -1) return [...prev, updated];
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(stationChannel);
    };
  }, [orderId, supabase, user, fetchOrder, fetchStationStatuses]);

  // Recover from realtime events missed while the tab was in the background.
  useRefetchOnFocus(() => {
    fetchOrder();
    fetchStationStatuses();
  });


  /* ---------------- UI RENDERING ---------------- */

  if (isLoading) return <Card className="max-w-md mx-auto p-6"><Skeleton className="h-6 w-40 mb-4" /><Skeleton className="h-48 w-full" /></Card>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!order) return <Alert variant="destructive"><AlertTitle>Order not found</AlertTitle></Alert>;

  const terminalStatusUI = order.status === 'CANCELLED' ? overallStatusDisplayMap[order.status] : null;
  const subTotal = order.totalAmount / 1.05;
  const taxAmount = order.totalAmount - subTotal;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-4 mb-8 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/orders")} className="shrink-0">
          <ArrowLeft />
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Order</h1>
      </div>

      <Card className="max-w-md mx-auto shadow-lg rounded-2xl">
        {/* ... Card content remains the same ... */}
        <CardContent className="p-0">
          <div className="text-center p-8 border-b border-muted/60 rounded-t-2xl">
            <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-2">Order Number</p>
            <h2 className="text-7xl font-extrabold tracking-tighter text-[#154b23] flex justify-center">
              {order.display_order_id?.split("").map((char, i) => (
                <SlotChar key={i} char={char} index={i} />
              ))}
            </h2>
            <p className="font-bold text-lg mt-4 text-foreground">{order.userName}</p>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(order.orderDate), "MMM dd, yyyy 'at' h:mm a")}</p>
          </div>

          {order.status === 'DELIVERED' && (
            <div className="flex items-center justify-center gap-3 p-4 text-lg font-bold bg-green-600 text-primary-foreground shadow-inner">
              <CheckCircle2 className="h-5 w-5" />
              <span>Delivered</span>
            </div>
          )}

          {terminalStatusUI ? (
            <div className={cn("flex items-center justify-center gap-3 p-4 text-lg font-bold", terminalStatusUI.className)}>
              {terminalStatusUI.icon}
              <span>{terminalStatusUI.label}</span>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-base">
                <ShoppingBag className="h-5 w-5" /> Item Status
              </h3>
              <div className="space-y-6">
                {groupedItemsByStation.map((group) => (
                  <div key={group.stationId}>
                    <div className="flex justify-between items-start sm:items-center gap-4 mb-4">
                      <p className="font-bold text-lg leading-tight">{group.stationName}</p>
                      <Badge variant="outline" className={cn("gap-1.5 font-semibold px-2.5 py-0.5 text-sm shrink-0", stationStatusDisplayMap[group.status].className)}>
                        {stationStatusDisplayMap[group.status].icon}
                        {stationStatusDisplayMap[group.status].label}
                      </Badge>
                    </div>
                    <ul className="space-y-3 mt-4">
                      {group.items.map((item) => (
                        <li key={item.uuid} className="flex justify-between items-center py-2 pl-4 ml-1 border-l-2 border-muted">
                          <span className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{item.quantity} &times;</span>
                            <span className="text-base text-foreground font-medium">{item.name}</span>
                          </span>
                          <span className="text-base font-semibold">₹{(item.quantity * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />
          <div className="p-8 space-y-3 rounded-b-2xl">
            <div className="flex justify-between text-muted-foreground text-sm font-medium">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs font-medium border-b pb-4">
              <span>Taxes (GST 5%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-2xl pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-[#154b23]">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 border-t p-6 pb-6">
          <Button
            className="w-full bg-[#154b23] hover:bg-[#0e3318]"
            onClick={() => router.push(`/feedback?orderId=${orderId}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>

          <Button variant="outline" className="w-full" onClick={async () => {
            setIsManualFetching(true);
            await Promise.all([fetchOrder(), fetchStationStatuses()]);
            setIsManualFetching(false);
          }} disabled={isManualFetching}>
            {isManualFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Check for updates</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
