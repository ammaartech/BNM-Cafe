
'use client';

import { useMemo, useState } from 'react';
import type { KotTicket } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    // State updates via realtime refetch in parent, no need to set isUpdating(null)
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
    return ticket.items.every(item => item.status === 'READY');
  }, [ticket.items]);

  const timeSinceOrder = useMemo(() => formatDistanceToNow(new Date(ticket.orderDate), { addSuffix: true }), [ticket.orderDate]);
  
  const cardBorderColor = useMemo(() => {
      switch (ticket.stationStatus) {
        case 'PENDING': return 'border-destructive/80';
        case 'COOKING': return 'border-primary';
        case 'READY': return 'border-green-500';
        default: return 'border-transparent';
      }
  }, [ticket.stationStatus]);


  return (
    <Card className={cn("shadow-lg flex flex-col h-fit border-l-4", cardBorderColor)}>
      <CardHeader className="p-3 flex-row justify-between items-center">
        <h3 className="text-xl font-bold">#{ticket.dailyOrderId}</h3>
        <p className="text-xs text-muted-foreground font-medium">{timeSinceOrder}</p>
      </CardHeader>
      <Separator />
      <CardContent className="p-3 pt-3 flex-grow space-y-3">
        {ticket.items.map(item => (
          <div key={item.id} className="grid grid-cols-5 items-center gap-2">
            <div className="col-span-3">
              <p className="font-semibold text-base leading-tight">{item.name}</p>
              <p className="text-sm text-muted-foreground font-bold">Qty: {item.quantity}</p>
            </div>
            <div className="col-span-2 flex flex-col items-end gap-1.5">
               <Badge
                  variant={item.status === 'READY' ? 'default' : 'secondary'}
                  className={cn('font-bold', {
                      'bg-amber-500 text-white': item.status === 'COOKING',
                      'bg-green-600 text-white': item.status === 'READY',
                  })}
                  >{item.status}
              </Badge>
              {item.status === 'PENDING' && (
                <Button size="sm" onClick={() => handleUpdateItemStatus(item.id, 'COOKING')} disabled={isUpdating === item.id}>
                  {isUpdating === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Start Cooking'}
                </Button>
              )}
              {item.status === 'COOKING' && (
                <Button size="sm" variant="outline" onClick={() => handleUpdateItemStatus(item.id, 'READY')} disabled={isUpdating === item.id}>
                   {isUpdating === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Mark Ready'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      {ticket.stationStatus === 'READY' && areAllItemsReady && (
        <>
        <Separator />
        <div className="p-2">
            <Button className="w-full h-12 text-base" onClick={() => handleUpdateStationStatus('PICKED_UP')} disabled={isUpdating === ticket.orderId}>
                {isUpdating === ticket.orderId ? <Loader2 className="h-4 w-4 animate-spin"/> : 'CONFIRM PICKUP'}
            </Button>
        </div>
        </>
      )}
    </Card>
  );
}
