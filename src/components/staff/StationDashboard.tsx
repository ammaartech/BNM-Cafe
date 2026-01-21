
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import type { KotTicket } from '@/lib/types';
import { KotTicketCard } from '@/components/staff/KotTicketCard';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, WifiOff, ServerCrash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

type StationDashboardProps = {
  station: {
    id: string;
    name: string;
    code: string;
  };
};

export default function StationDashboard({ station }: StationDashboardProps) {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [tickets, setTickets] = useState<KotTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!supabase) return;

    const { data, error: rpcError } = await supabase.rpc('get_station_dashboard', {
      p_station_code: station.code,
    });

    if (rpcError) {
      console.error('Error fetching dashboard data:', rpcError);
      setError('Failed to load dashboard data. Please try refreshing.');
    } else {
      setTickets(data as KotTicket[]);
    }
    setIsLoading(false);
  }, [supabase, station.code]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!supabase) return;

    // Listen for new orders for this station
    const newOrderChannel = supabase
      .channel(`station-new-orders-${station.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_stations', filter: `station_id=eq.${station.id}` },
        () => {
          // New order detected, refetch everything to ensure consistency.
          // For a more granular approach, you could fetch just the new ticket.
          fetchInitialData();
        }
      )
      .subscribe();

    // Listen to updates on items and the overall order
    const updateChannel = supabase
      .channel(`station-updates-${station.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_items' }, () => fetchInitialData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchInitialData())
      .subscribe();

    return () => {
      supabase.removeChannel(newOrderChannel);
      supabase.removeChannel(updateChannel);
    };
  }, [supabase, station.id, fetchInitialData]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  const { pending, cooking, ready } = useMemo(() => {
    return {
      pending: tickets.filter(t => t.stationStatus === 'PENDING'),
      cooking: tickets.filter(t => t.stationStatus === 'COOKING'),
      ready: tickets.filter(t => t.stationStatus === 'READY'),
    };
  }, [tickets]);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="p-4 bg-background border-b shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{station.name} Station Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </header>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex-grow flex items-center justify-center text-center">
            <div className="p-8 border-2 border-dashed border-destructive/50 rounded-2xl">
                <ServerCrash className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-destructive">Connection Error</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button onClick={fetchInitialData} className="mt-6">Try Again</Button>
            </div>
        </div>
      )}
      
      {!isLoading && !error && (
        <main className="flex-grow flex overflow-x-auto p-4 gap-4">
          <div className="flex-shrink-0 w-80 md:w-96">
            <h2 className="text-lg font-semibold mb-2 px-2">Pending ({pending.length})</h2>
            <div className="space-y-4 h-full overflow-y-auto rounded-lg p-1">
              {pending.map(ticket => <KotTicketCard key={ticket.orderId} ticket={ticket} stationId={station.id} />)}
            </div>
          </div>
          <div className="flex-shrink-0 w-80 md:w-96">
            <h2 className="text-lg font-semibold mb-2 px-2">Cooking ({cooking.length})</h2>
            <div className="space-y-4 h-full overflow-y-auto rounded-lg p-1">
              {cooking.map(ticket => <KotTicketCard key={ticket.orderId} ticket={ticket} stationId={station.id} />)}
            </div>
          </div>
          <div className="flex-shrink-0 w-80 md:w-96">
            <h2 className="text-lg font-semibold mb-2 px-2">Ready for Pickup ({ready.length})</h2>
            <div className="space-y-4 h-full overflow-y-auto rounded-lg p-1">
              {ready.map(ticket => <KotTicketCard key={ticket.orderId} ticket={ticket} stationId={station.id} />)}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
