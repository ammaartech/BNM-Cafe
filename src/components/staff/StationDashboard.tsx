
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import type { KotTicket } from '@/lib/types';
import { KotTicketCard } from '@/components/staff/KotTicketCard';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, WifiOff, ServerCrash } from 'lucide-react';
import { useRouter } from 'next/navigation';

type StationDashboardProps = {
  station: {
    id: string;
    name: string;
    code: string;
  };
};

export default function StationDashboard({ station }: StationDashboardProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [tickets, setTickets] = useState<KotTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    // Don't set loading to true here on refetch, only on initial load
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
    setIsLoading(true);
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`station-dashboard-${station.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_stations' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchInitialData())
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime connected for station ${station.name}`);
        }
        if (err) {
            console.error('Realtime subscription error', err);
            setError('Realtime connection failed. Data may be out of date.');
        }
      });
      
    // Safety refetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase, station.id, fetchInitialData, station.name]);

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

  const columns = [
    { title: 'Pending', tickets: pending, count: pending.length },
    { title: 'Cooking', tickets: cooking, count: cooking.length },
    { title: 'Ready', tickets: ready, count: ready.length },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <header className="p-3 bg-card border-b shadow-sm flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold tracking-tight">{station.name} Station</h1>
        <Button variant="outline" onClick={handleLogout} size="sm">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </header>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex-grow flex items-center justify-center text-center">
            <div className="p-8 border-2 border-dashed border-destructive/50 rounded-2xl">
                <ServerCrash className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-destructive">Connection Error</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button onClick={() => { setIsLoading(true); fetchInitialData(); }} className="mt-6">Try Again</Button>
            </div>
        </div>
      ) : (
        <main className="flex-grow flex overflow-x-auto p-2 sm:p-4 gap-4">
          {columns.map(column => (
            <div key={column.title} className="flex-shrink-0 w-[300px] sm:w-[350px] md:w-[400px] flex flex-col">
              <h2 className="text-lg font-semibold mb-2 px-2 text-foreground/80">{column.title} ({column.count})</h2>
              <div className="space-y-4 flex-grow overflow-y-auto rounded-lg p-1 no-scrollbar">
                {column.tickets.length > 0 ? (
                  column.tickets.map(ticket => <KotTicketCard key={ticket.orderId} ticket={ticket} stationId={station.id} />)
                ) : (
                    <div className="text-center text-muted-foreground pt-10 text-sm">No orders in this state.</div>
                )}
              </div>
            </div>
          ))}
        </main>
      )}
    </div>
  );
}
