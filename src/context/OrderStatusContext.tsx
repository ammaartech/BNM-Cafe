
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

interface OrderStatusContextType {
    hasReadyOrder: boolean;
    fetchOrdersStatus: (userId: string) => Promise<void>;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export const OrderStatusProvider = ({ children }: { children: ReactNode }) => {
    const { supabase, user, isUserLoading } = useSupabase();
    const pathname = usePathname();

    const fetcher = async ([_, userId]: [string, string]) => {
        if (!supabase) return false;

        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'READY')
            .is('pickup_notified_at', null);

        return !error ? (count || 0) > 0 : false;
    };

    const { data: hasReadyOrder, mutate } = useSWR(
        user && !isUserLoading ? ['order-status', user.id] : null,
        fetcher,
        {
            revalidateOnFocus: true
        }
    );

    const handleRealtimeUpdate = useCallback((payload: any) => {
        if (user && payload.new.user_id === user.id) {
            if (payload.new.status === 'READY' && payload.new.pickup_notified_at === null) {
                mutate(true, false);
            } else {
                // Re-fetch to get the accurate count for all states, especially after pickup or cancellation
                mutate();
            }
        }
    }, [user, mutate]);

    useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('order-status-context-channel')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `status=in.("READY","DELIVERED","CANCELLED")` // Listen for relevant status changes
            }, handleRealtimeUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, handleRealtimeUpdate]);


    const fetchOrdersStatus = useCallback(async (userId: string) => {
        if (user && user.id === userId) {
            await mutate();
        }
    }, [user, mutate]);

    const value = {
        hasReadyOrder: hasReadyOrder || false,
        fetchOrdersStatus,
    };

    return (
        <OrderStatusContext.Provider value={value}>
            {children}
        </OrderStatusContext.Provider>
    );
};

export const useOrderStatus = () => {
    const context = useContext(OrderStatusContext);
    if (context === undefined) {
        throw new Error('useOrderStatus must be used within an OrderStatusProvider');
    }
    return context;
};
