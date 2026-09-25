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
import { useMemo, useCallback } from "react";
import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase/provider";
import { useRealtime } from "@/lib/supabase/realtime";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { syncOrderStatus } from "@/lib/orderSync";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ---------------- SAFE DATE ---------------- */

function safeFormatDistanceToNow(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (e) {
    return "—";
  }
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
            {items.map((item, idx) => (
              <li key={item.id ?? `${item.name}-${idx}`}>
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

      <CardFooter className="flex flex-col gap-2 mt-auto pt-4">
        <Badge
          className={cn("w-full justify-center py-1.5", {
            "bg-blue-500 text-white": order.status === "PENDING",
            "bg-yellow-500 text-white": order.status === "READY",
            "bg-green-600 text-white": order.status === "DELIVERED",
          })}
        >
          {statusDisplay.icon}
          <span className="ml-2">{statusDisplay.label}</span>
        </Badge>

        {order.status === "PENDING" && (
          <div className="flex gap-2 w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="sm">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel order #{order.display_order_id}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This marks the order as cancelled and removes it from the live
                    queue. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onUpdateStatus(order.id, "CANCELLED")}
                  >
                    Cancel order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={() => onUpdateStatus(order.id, "READY")}
            >
              Mark Ready
            </Button>
          </div>
        )}

        {order.status === "READY" && (
          <Button
            className="w-full"
            size="sm"
            onClick={() => onUpdateStatus(order.id, "DELIVERED")}
          >
            Mark Delivered
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/* ---------------- ORDER GRID ---------------- */

function OrderGrid({
  orders,
  onUpdateStatus,
}: {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <Package className="mx-auto h-12 w-12" />
        <p className="mt-4">No orders in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {orders.map((order) => (
        <KOTCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
      ))}
    </div>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */

// History shown under "Completed" / "All Orders". Live orders are always
// loaded in full; only the finished tail is capped, so the dashboard stays fast
// however many orders the cafe has taken.
const RECENT_ORDERS_LIMIT = 100;
const ORDER_COLUMNS =
  "id, display_order_id, user_id, user_name, order_date, total_amount, status, order_items(id, menu_item_uuid, name, quantity, price)";

function toOrder(o: any): Order {
  return {
    id: o.id,
    display_order_id: o.display_order_id,
    userId: o.user_id,
    userName: o.user_name,
    orderDate: o.order_date,
    totalAmount: o.total_amount,
    status: o.status,
    items: o.order_items ?? [],
  };
}

async function fetchAdminOrders(supabase: SupabaseClient): Promise<Order[]> {
  const [live, recent] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .in("status", ["PENDING", "READY"])
      .order("order_date", { ascending: false }),
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .order("order_date", { ascending: false })
      .limit(RECENT_ORDERS_LIMIT),
  ]);
  if (live.error) throw live.error;
  if (recent.error) throw recent.error;

  const byId = new Map<string, Order>();
  for (const o of [...(live.data ?? []), ...(recent.data ?? [])]) byId.set(o.id, toOrder(o));
  return Array.from(byId.values()).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

function AdminDashboard({ supabase }: { supabase: SupabaseClient }) {
  const { toast } = useToast();

  const { data: orders = [], isLoading, mutate } = useSWR(
    ["admin-orders"],
    () => fetchAdminOrders(supabase)
  );

  // One refetch per burst: a new order fires several events at once.
  useRealtime("admin-orders", [{ table: "orders" }], () => mutate(), { debounceMs: 400 });

  const handleUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    // Move the card at once; the realtime echo (or the rollback) settles it.
    mutate(
      (current) => current?.map((o) => (o.id === orderId ? { ...o, status } : o)),
      { revalidate: false }
    );

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      mutate();
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (status === 'READY') {
      await syncOrderStatus(supabase, orderId);
    }

    toast({ title: "Updated", description: `Order marked ${status}` });
  }, [supabase, mutate, toast]);

  const liveOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING" || o.status === "READY"),
    [orders]
  );
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED"),
    [orders]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="live">
      <TabsList className="grid w-full grid-cols-3 mb-4" data-tour="admin-kot-tabs">
        <TabsTrigger value="live">Live KOT</TabsTrigger>
        <TabsTrigger value="delivered">Completed</TabsTrigger>
        <TabsTrigger value="all">All Orders</TabsTrigger>
      </TabsList>
      <TabsContent value="live">
        <OrderGrid orders={liveOrders} onUpdateStatus={handleUpdateStatus} />
      </TabsContent>
      <TabsContent value="delivered">
        <OrderGrid orders={deliveredOrders} onUpdateStatus={handleUpdateStatus} />
      </TabsContent>
      <TabsContent value="all">
        <p className="mb-4 text-sm text-muted-foreground">
          Every live order, plus the latest {RECENT_ORDERS_LIMIT}. Full history is in Analytics.
        </p>
        <OrderGrid orders={orders} onUpdateStatus={handleUpdateStatus} />
      </TabsContent>
    </Tabs>
  );
}


/* ---------------- PAGE ---------------- */

export default function AdminPage() {
  const { user, userProfile, isUserLoading, supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  }

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!user || user.is_anonymous) {
    return (
      <div className="p-6 min-h-screen">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </header>
        <AdminLogin />
      </div>
    );
  }

  const isAdmin = userProfile?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/admin/analytics")} variant="outline">
            View Analytics
          </Button>
          <Button onClick={handleLogout} variant="secondary">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <AdminDashboard supabase={supabase} />
    </div>
  );
}

