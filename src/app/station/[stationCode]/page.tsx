'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import type { Station, OrderStationStatus } from '@/lib/types';
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

/* -------------------- STATUS UI -------------------- */

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

/* -------------------- TYPES -------------------- */

type StationOrder = {
  orderStationId: string;
  orderId: string;
  displayOrderId: string;
  userName: string;
  orderDate: string;
  status: OrderStationStatus;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
};

/* -------------------- CARD -------------------- */

function KOTCard({
  order,
  onUpdate,
}: {
  order: StationOrder;
  onUpdate: (osId: string, orderId: string, status: OrderStationStatus) => void;
}) {
  const meta = statusMap[order.status];

  return (
    <Card className="w-[300px] shadow-md">
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

      <CardContent>
        <ul className="space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-2">
              <span className="font-bold w-6">{item.quantity}x</span>
              <span className="font-medium">{item.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
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
            className="bg-green-600 hover:bg-green-700"
            onClick={() =>
              onUpdate(order.orderStationId, order.orderId, 'READY')
            }
          >
            Mark as Ready
          </Button>
        )}

        {order.status === 'READY' && (
          <Button
            onClick={() =>
              onUpdate(order.orderStationId, order.orderId, 'PICKED_UP')
            }
          >
            Mark as Picked Up
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/* -------------------- PAGE -------------------- */

export default function StationPage() {
  const { stationCode } = useParams();
  const { supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();

  const [station, setStation] = useState<Station | null>(null);
  const [orders, setOrders] = useState<StationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -------------------- FETCH -------------------- */

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    try {
      /* 1. Station */
      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .select('id, name')
        .eq('code', stationCode)
        .single();

      if (stationError || !stationData) {
        throw new Error('Station not found');
      }

      setStation(stationData);
      const stationId = stationData.id;

      /* 2. LIVE ORDERS (EXACTLY LIKE ADMIN) */
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          display_order_id,
          user_name,
          order_date,
          order_stations!inner (
            id,
            status
          ),
          order_items (
            id,
            name,
            quantity,
            price
          )
        `
        )
        .in('status', ['PENDING', 'READY'])
        .eq('order_stations.station_id', stationId)
        .neq('order_stations.status', 'PICKED_UP')
        .order('order_date', { ascending: true });

      if (error) throw error;

      const mapped: StationOrder[] = data.map((o: any) => ({
        orderStationId: o.order_stations[0].id,
        orderId: o.id,
        displayOrderId: o.display_order_id,
        userName: o.user_name,
        orderDate: o.order_date,
        status: o.order_stations[0].status,
        items: o.order_items,
      }));

      setOrders(mapped);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, stationCode]);

  useEffect(() => {
    if (!isUserLoading) fetchData();
  }, [isUserLoading, fetchData]);

  /* -------------------- ACTIONS -------------------- */

  const updateStatus = async (
    osId: string,
    orderId: string,
    status: OrderStationStatus
  ) => {
    const payload: any = { status };
    if (status === 'READY') payload.ready_at = new Date().toISOString();
    if (status === 'PICKED_UP')
      payload.picked_up_at = new Date().toISOString();

    const { error } = await supabase
      .from('order_stations')
      .update(payload)
      .eq('id', osId);

    if (error) {
      toast({ title: 'Error updating ticket', variant: 'destructive' });
      return;
    }

    toast({ title: 'Updated', description: `Marked as ${status}` });
    fetchData();
  };

  /* -------------------- UI -------------------- */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
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

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold">All caught up!</h2>
          <p>No active orders for this station.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {orders.map((o) => (
            <KOTCard key={o.orderStationId} order={o} onUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
