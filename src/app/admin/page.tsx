"use client";

import type { Order, OrderStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  AlertCircle,
  LogOut,
  Loader2,
  CheckCircle2,
  Clock,
  CookingPot,
  XCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

import { syncOrderStatus } from "@/lib/orderSync";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";

/* ---------------- SAFE DATE ---------------- */

function safeFormatDistanceToNow(dateString?: string | null): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

/* ---------------- STATUS DISPLAY ---------------- */

const statusDisplayMap: Partial<
  Record<OrderStatus, { label: string; icon: React.ReactNode }>
> = {
  PENDING: { label: "Pending", icon: <Clock className="h-4 w-4" /> },
  READY: { label: "Ready", icon: <CookingPot className="h-4 w-4" /> },
  DELIVERED: { label: "Delivered", icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED: { label: "Cancelled", icon: <XCircle className="h-4 w-4" /> },
};


/* ---------------- KOT CARD ---------------- */

function KOTCard({
  order,
  onUpdateStatus,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
    const statusDisplay =
    statusDisplayMap[order.status] ?? {
      label: order.status,
      icon: <Package className="h-4 w-4" />,
    };
  

  const items = order.items ?? [];

  return (
    <Card className="flex flex-col shadow-lg">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-xl font-bold">
            #{order.display_order_id}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {safeFormatDistanceToNow(order.orderDate)}
          </span>
        </div>
        <p className="text-sm">{order.userName}</p>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.uuid}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No items found
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Badge
          className={cn("w-full justify-center", {
            "bg-blue-500 text-white": order.status === "PENDING",
            "bg-yellow-500 text-white": order.status === "READY",
            "bg-green-600 text-white": order.status === "DELIVERED",
          })}
        >
          {statusDisplay.icon}
          <span className="ml-2">{statusDisplay.label}</span>
        </Badge>

        {order.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateStatus(order.id, "READY")}
            >
              Mark Ready
            </Button>
          </div>
        )}

        {order.status === "READY" && (
          <Button
            className="w-full"
            onClick={() => onUpdateStatus(order.id, "DELIVERED")}
          >
            Mark Delivered
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */

function AdminDashboard({ supabase }: { supabase: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("order_date", { ascending: false });

    if (!error && data) {
      // 🔑 normalize items so map is always safe
      const normalized = data.map((o: any) => ({
        ...o,
        items: o.order_items ?? [],
      }));
      setOrders(normalized);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();

    const channel: RealtimeChannel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (_payload: RealtimePostgresChangesPayload<Order>) => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, supabase]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await syncOrderStatus(orderId, supabase);

    toast({ title: "Updated", description: `Order marked ${status}` });
  };

  const liveOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING" || o.status === "READY"),
    [orders]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {liveOrders.map((order) => (
        <KOTCard
          key={order.id}
          order={order}
          onUpdateStatus={handleUpdateStatus}
        />
      ))}
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function AdminPage() {
  const { user, userProfile, isUserLoading, supabase } = useSupabase();
  const router = useRouter();

  if (isUserLoading) {
    return <Loader2 className="animate-spin" />;
  }

  const isAdmin =
    user && !user.is_anonymous && userProfile?.role === "admin";

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <header className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => router.push("/admin/analytics")}>
          View Analytics
        </Button>
      </header>

      <AdminDashboard supabase={supabase} />
    </div>
  );
}
