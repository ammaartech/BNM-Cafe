
'use client';

import { useMemo, useState } from 'react';
import type { KotTicket } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSupabase } from '@/lib/supabase/provider';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

type KotTicketCardProps = {
  ticket: KotTicket;
  stationId: string;
};

export function KotTicketCard({ ticket, stationId }: KotTicketCardProps) {
  const { supabase } = useSupabase();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleUpdateItemStatus = async (itemId: string, newStatus: 'COOKING' | 'READY') => {
    setIsUpdating(itemId);
    if (!supabase) return;
    await supabase.rpc('update_order_item_status', { p_item_id: itemId, p_new_status: newStatus });
    // State will update via realtime, no need to set isUpdating(null) here as the component will re-render
  };

  const handleUpdateStationStatus = async (newStatus: 'PICKED_UP') => {
    setIsUpdating(ticket.orderId); // Use orderId as the update key
    if (!supabase) return;
    await supabase.rpc('update_order_station_status', {
      p_order_id: ticket.orderId,
      p_station_id: stationId,
      p_new_status: newStatus,
    });
  };

  const areAllItemsReady = useMemo(() => {
    return ticket.items.every(item => item.status === 'READY' || item.status === 'PICKED_UP');
  }, [ticket.items]);

  const cardColor = useMemo(() => {
    switch (ticket.stationStatus) {
      case 'PENDING': return 'bg-background';
      case 'COOKING': return 'bg-amber-50';
      case 'READY': return 'bg-green-50';
      default: return 'bg-background';
    }
  }, [ticket.stationStatus]);

  const timeSinceOrder = formatDistanceToNow(new Date(ticket.orderDate), { addSuffix: true });

  const getActionForItem = (item: KotTicket['items'][0]) => {
    const isItemUpdating = isUpdating === item.id;
    switch (item.status) {
      case 'PENDING':
        return (
          <Button size="sm" onClick={() => handleUpdateItemStatus(item.id, 'COOKING')} disabled={isItemUpdating}>
            {isItemUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Start Cooking'}
          </Button>
        );
      case 'COOKING':
        return (
          <Button size="sm" variant="outline" onClick={() => handleUpdateItemStatus(item.id, 'READY')} disabled={isItemUpdating}>
             {isItemUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Mark Ready'}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn("shadow-md flex flex-col h-fit", cardColor)}>
      <CardHeader className="p-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">#{ticket.dailyOrderId}</CardTitle>
          <p className="text-xs text-muted-foreground font-medium">{timeSinceOrder}</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-grow">
        <div className="space-y-3">
          {ticket.items.map(item => (
            <div key={item.id} className="grid grid-cols-5 items-center gap-2">
              <div className="col-span-3">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="col-span-2 flex flex-col items-end gap-1.5">
                 <Badge
                    variant={item.status === 'READY' ? 'default' : 'secondary'}
                    className={cn({
                        'bg-amber-500 text-white': item.status === 'COOKING',
                        'bg-green-600 text-white': item.status === 'READY',
                    })}
                    >{item.status}
                </Badge>
                {getActionForItem(item)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {ticket.stationStatus === 'READY' && areAllItemsReady && (
        <>
        <Separator />
        <CardFooter className="p-3">
            <Button className="w-full h-12 text-base" onClick={() => handleUpdateStationStatus('PICKED_UP')} disabled={isUpdating === ticket.orderId}>
                {isUpdating === ticket.orderId ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Confirm Pickup'}
            </Button>
        </CardFooter>
        </>
      )}
    </Card>
  );
}
