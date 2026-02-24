
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import type { Station, OrderStationStatus, StationOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Clock,
  CookingPot,
  Check,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { syncOrderStatus } from '@/lib/orderSync';
import { RealtimeChannel } from '@supabase/supabase-js';

/* ---------------------------------- */
/* Status Display Map                 */
/* ---------------------------------- */
const statusMap: Record<
  OrderStationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-blue-500 text-white',
    icon: <Clock className="h-4 w-4" />,
  },
  READY: {
    label: 'Ready',
    className: 'bg-yellow-500 text-white',
    icon: <CookingPot className="h-4 w-4" />,
  },
  PICKED_UP: {
    label: 'Picked Up',
    className: 'bg-green-600 text-white',
    icon: <Check className="h-4 w-4" />,
  },
};

/* ---------------------------------- */
/* KOT Card                           */
/* ---------------------------------- */
function KOTCard({
  order,
  onUpdate,
}: {
  order: StationOrder;
  onUpdate: (osId: string, status: OrderStationStatus, orderId: string) => void;
}) {
  const meta = statusMap[order.status];

  return (
    <Card className="w-[300px] shadow-md flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">
            #{order.displayOrderId}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm font-medium">{order.userName}</p>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-2">
              <span className="font-bold w-6">{item.quantity}x</span>
              <span className="font-medium">{item.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 mt-auto pt-4">
        <Badge
          className={cn(
            'w-full justify-center py-1.5 text-sm',
            meta.className
          )}
        >
          {meta.icon}
          <span className="ml-2">{meta.label}</span>
        </Badge>

        {order.status === 'PENDING' && (
          <Button
            className="bg-green-600 hover:bg-green-700 w-full"
            onClick={() =>
              onUpdate(order.orderStationId, 'READY', order.orderId)
            }
          >
            Mark as Ready
          </Button>
        )}

        {order.status === 'READY' && (
          <Button
            className="w-full"
            onClick={() =>
              onUpdate(order.orderStationId, 'PICKED_UP', order.orderId)
            }
          >
            Mark as Picked Up
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/* ---------------------------------- */
/* Station Page                       */
/* ---------------------------------- */
export default function StationPage() {
  const { stationCode } = useParams<{ stationCode: string }>();
  const { supabase, user, userProfile, isUserLoading } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();

  const [station, setStation] = useState<Station | null>(null);
  const [orders, setOrders] = useState<StationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!supabase || !stationCode) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      // 1. Get current station
      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .select('id, name, code, active')
        .eq('code', stationCode)
        .single();

      if (stationError || !stationData) throw new Error('Station not found.');
      setStation(stationData);

      // 2. Fetch all LIVE orders (Pending or Ready) that have been PAID
      const { data: liveOrdersData, error: liveOrdersError } = await supabase
        .from('orders')
        .select('*, order_stations(*), order_items(*, menu_items(station_id))')
        .in('status', ['PENDING', 'READY'])
        .eq('payment_status', 'PAID')
        .order('order_date', { ascending: false });

      if (liveOrdersError) throw liveOrdersError;

      // 3. Filter these orders to find the ones relevant to THIS station
      const stationOrders = liveOrdersData
        .map(order => {
          // Find the items for THIS station within the order
          const stationItems = order.order_items.filter(
            (oi: any) => oi.menu_items?.station_id === stationData.id
          );

          // If no items for this station, skip this order
          if (stationItems.length === 0) {
            return null;
          }

          // Find the corresponding order_stations entry for this station
          const orderStation = order.order_stations.find(
            (os: any) => os.station_id === stationData.id
          );

          // If there's no ticket for this station (shouldn't happen), or it's already picked up, skip
          if (!orderStation || orderStation.status === 'PICKED_UP') {
            return null;
          }

          return {
            orderStationId: orderStation.id,
            orderId: order.id,
            displayOrderId: order.display_order_id,
            userName: order.user_name,
            orderDate: order.order_date,
            status: orderStation.status,
            items: stationItems.map((si: any) => ({
              id: si.id,
              name: si.name,
              quantity: si.quantity,
              price: si.price,
            })),
          };
        })
        .filter((o): o is StationOrder => o !== null);

      setOrders(stationOrders);

    } catch (e: any) {
      setError(e.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [supabase, stationCode]);

  useEffect(() => {
    if (!isUserLoading) fetchData(true);
  }, [isUserLoading, fetchData]);

  // REALTIME LISTENER
  useEffect(() => {
    if (!supabase || !station?.id) return;

    const channel: RealtimeChannel = supabase.channel(`station-channel-${station.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_stations',
          filter: `station_id=eq.${station.id}`
        },
        (_payload) => {
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (_payload) => {
          fetchData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `payment_status=eq.PAID`
        },
        (_payload) => {
          fetchData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [supabase, station?.id, fetchData]);

  const updateStatus = async (
    osId: string,
    status: OrderStationStatus,
    orderId: string
  ) => {
    if (!supabase) return;

    // --- Optimistic Update ---
    // Save original state in case of error
    const previousOrders = [...orders];

    // Update local state instantly so UI responds linearly
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.orderStationId === osId ? { ...order, status } : order
      )
    );

    // Filter out if picked up, as we don't show picked up orders on the station dashboard
    if (status === 'PICKED_UP') {
      setOrders(prevOrders => prevOrders.filter(order => order.orderStationId !== osId));
    }

    const { error } = await supabase
      .from('order_stations')
      .update({ status })
      .eq('id', osId);

    if (error) {
      // Revert optimistic update
      setOrders(previousOrders);
      toast({ title: 'Error updating ticket', variant: 'destructive' });
      return;
    }

    // Still sync order status overall, doing so silently
    syncOrderStatus(supabase, orderId).catch(err => console.error("Sync error:", err));

    toast({ title: 'Updated', description: `Marked as ${status}` });
  };

  // --- AUTH GUARD ---
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-4">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    router.replace('/station');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (user.is_anonymous || userProfile?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this station dashboard.
          </AlertDescription>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/station">Back to Station Selection</Link>
          </Button>
        </Alert>
      </div>
    );
  }
  // --- END OF AUTH GUARD ---


  if (loading && !station) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-4">Loading station data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Station</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{station?.name}</h1>
        <Button variant="outline" asChild>
          <Link href="/station">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stations
          </Link>
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p>No active orders for this station.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {orders.map((o) => (
            <KOTCard
              key={o.orderStationId}
              order={o}
              onUpdate={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
