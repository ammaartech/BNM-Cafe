
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import type { Station, StationOrder, OrderStationStatus, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CookingPot, Package, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusDisplayMap: { [key in OrderStationStatus]: { label: string; icon: React.ReactNode; className: string } } = {
    PENDING: { label: 'Pending', icon: <Clock className="h-4 w-4" />, className: 'bg-blue-500 text-white' },
    READY: { label: 'Ready', icon: <CookingPot className="h-4 w-4" />, className: 'bg-yellow-500 text-white' },
    PICKED_UP: { label: 'Picked Up', icon: <Check className="h-4 w-4" />, className: 'bg-green-600 text-white' },
};


function KOTCard({ order, onUpdateStatus }: { order: StationOrder; onUpdateStatus: (orderStationId: string, orderId: string, status: OrderStationStatus) => void }) {
    const statusDisplay = statusDisplayMap[order.status];

    return (
        <Card className="flex flex-col shadow-lg bg-card rounded-lg w-[300px]">
            <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                <div className="flex justify-between items-baseline">
                    <CardTitle className="text-2xl font-bold">#{(order.displayOrderId || '...').toUpperCase()}</CardTitle>
                     <p className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                    </p>
                </div>
                <p className="text-sm font-medium">{order.userName}</p>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <ul className="space-y-2">
                    {order.items.map((item, index) => (
                        <li key={item.uuid || index} className="flex text-base items-center">
                            <span className="w-8 text-center font-bold">{item.quantity}x</span>
                            <span className="flex-1 font-semibold">{item.name}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-3 border-t flex flex-col items-stretch gap-2 mt-auto">
                 <Badge 
                    className={cn('font-semibold text-sm w-full justify-center py-1.5', statusDisplay.className)}
                >
                    {statusDisplay.icon}
                    <span className="ml-2">{statusDisplay.label}</span>
                </Badge>
                {order.status === 'PENDING' && (
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => onUpdateStatus(order.orderStationId, order.orderId, 'READY')}>
                        Mark as Ready
                    </Button>
                )}
                {order.status === 'READY' && (
                    <Button size="sm" className="w-full" onClick={() => onUpdateStatus(order.orderStationId, order.orderId, 'PICKED_UP')}>
                        Mark as Picked Up
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function StationPage() {
  const router = useRouter();
  const params = useParams();
  const stationCode = params.stationCode as string;
  const { supabase, isUserLoading } = useSupabase();
  const { toast } = useToast();
  
  const [station, setStation] = useState<Station | null>(null);
  const [orders, setOrders] = useState<StationOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase || !stationCode) return;
    setIsLoading(true);
    setError(null);

    try {
        // 1. Get the station ID from the URL code
        const { data: stationData, error: stationError } = await supabase
            .from('stations')
            .select('id, name')
            .eq('code', stationCode)
            .single();

        if (stationError || !stationData) {
            throw new Error(stationError?.message || `Station with code "${stationCode}" not found.`);
        }
        setStation(stationData as Station);
        const stationId = stationData.id;

        // 2. Get all menu item UUIDs for this station once for client-side filtering
        const { data: stationMenuItems, error: menuItemsError } = await supabase
            .from('menu_items')
            .select('uuid')
            .eq('station_id', stationId);

        if (menuItemsError) throw menuItemsError;
        const stationMenuItemUuids = new Set(stationMenuItems.map(item => item.uuid));

        // 3. Fetch all LIVE orders that have a ticket for this station
        const { data: rawOrders, error: ordersError } = await supabase
            .from('orders')
            .select(`
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
                    price,
                    menu_item_uuid
                )
            `)
            .in('status', ['PENDING', 'READY']) // Crucial: Only get live orders, like Admin KOT
            .eq('order_stations.station_id', stationId) // Join only on station tickets for this station
            .neq('order_stations.status', 'PICKED_UP') // And that are not yet picked up
            .order('order_date', { ascending: true }); // Ascending to show oldest first

        if (ordersError) {
             console.error("Error fetching station orders:", ordersError);
             throw ordersError;
        }

        // 4. Process the raw order data to create the final list of station tickets
        const processedOrders: StationOrder[] = rawOrders
            .map(order => {
                // Query guarantees order_stations has exactly one item for this station
                const stationTicket = order.order_stations[0];
                
                // Filter the main order's full item list to get only items for this station
                const stationItems: OrderItem[] = order.order_items
                    .filter(item => stationMenuItemUuids.has(item.menu_item_uuid!))
                    .map((item: any) => ({
                        id: item.menu_item_uuid,
                        uuid: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        menu_item_id: item.menu_item_uuid
                    }));
                
                // If, after filtering, there are no items for this station, something is wrong. Skip.
                if (stationItems.length === 0) {
                    return null;
                }

                // Construct the final StationOrder object
                return {
                    orderStationId: stationTicket.id,
                    orderId: order.id,
                    displayOrderId: order.display_order_id,
                    userName: order.user_name,
                    orderDate: order.order_date,
                    status: stationTicket.status as OrderStationStatus,
                    items: stationItems,
                };
            })
            .filter((o): o is StationOrder => o !== null);

        setOrders(processedOrders);

    } catch (e: any) {
        console.error("Error fetching station data:", e);
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  }, [supabase, stationCode]);

  useEffect(() => {
    if(!isUserLoading) {
      fetchData();
    }
  }, [isUserLoading, fetchData]);
  
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel(`station-updates-${stationCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
      (payload) => {
          console.log('Realtime change received on orders table for station!', payload);
          fetchData();
      })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'order_stations' }, 
      (payload) => {
          console.log('Realtime change received on order_stations table for station!', payload);
          fetchData();
      })
      .subscribe((status, err) => {
          if (err) {
              console.error(`Realtime subscription error for station ${stationCode}`, err);
          }
      });
    
    return () => {
        supabase.removeChannel(channel);
    };
  }, [supabase, stationCode, fetchData]);


  const handleUpdateStatus = useCallback(async (orderStationId: string, orderId: string, status: OrderStationStatus) => {
    if (!supabase) return;

    const originalOrders = [...orders];
    // Optimistic update: remove the ticket from the list
    setOrders(prev => prev.filter(o => o.orderStationId !== orderStationId));

    const updatePayload: { status: OrderStationStatus; ready_at?: string; picked_up_at?: string } = { status };
    if (status === 'READY') updatePayload.ready_at = new Date().toISOString();
    if (status === 'PICKED_UP') updatePayload.picked_up_at = new Date().toISOString();

    const { error: updateError } = await supabase
        .from('order_stations')
        .update(updatePayload)
        .eq('id', orderStationId);
    
    if (updateError) {
        toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
        // Rollback on error
        setOrders(originalOrders);
        return;
    }

    toast({ title: 'Success', description: `Ticket marked as ${status}.` });

    // Check if the main order is now fully complete (all station tickets are picked up)
    if (status === 'PICKED_UP') {
        // We delay this check slightly to allow for DB replication if needed
        setTimeout(async () => {
            const { count, error: countError } = await supabase
                .from('order_stations')
                .select('*', { count: 'exact', head: true })
                .eq('order_id', orderId)
                .neq('status', 'PICKED_UP');
            
            if (countError) {
                console.error("Error checking for order completion:", countError);
                return;
            }

            // If no other station tickets are left, mark the main order as DELIVERED
            if (count === 0) {
                const { data: updatedOrder, error: orderUpdateError } = await supabase
                    .from('orders')
                    .update({ status: 'DELIVERED' })
                    .eq('id', orderId)
                    .select('display_order_id')
                    .single();

                if (orderUpdateError) {
                    console.error("Error marking main order as delivered:", orderUpdateError);
                } else {
                    toast({ title: 'Order Completed!', description: `Order #${updatedOrder?.display_order_id} is now fully delivered.`});
                }
            }
        }, 500);
    }
  }, [supabase, toast, orders]);

  if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading station orders...</p>
        </div>
      );
  }

  if (error) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-screen">
            <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to load station</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" asChild className="mt-4">
                <Link href="/station"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Stations</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
      <header className="mb-6 flex justify-between items-center flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {station?.name || 'Station'}
        </h1>
        <Button variant="outline" asChild>
            <Link href="/station">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stations
            </Link>
        </Button>
      </header>
      <main className="flex-grow overflow-y-auto">
        {orders.length > 0 ? (
            <div className="flex flex-wrap gap-4 items-start">
                {orders.map(order => (
                    <KOTCard key={order.orderStationId} order={order} onUpdateStatus={handleUpdateStatus} />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="h-16 w-16 mb-4" />
                <h2 className="text-2xl font-bold">All caught up!</h2>
                <p>No active orders for this station.</p>
            </div>
        )}
      </main>
    </div>
  );
}
