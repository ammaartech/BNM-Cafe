"use client";

import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useRealtime } from '@/lib/supabase/realtime';
import useSWR from 'swr';

interface OrderStatusContextType {
    hasReadyOrder: boolean;
    /** Re-checks for ready orders, e.g. after one has been marked as notified. */
    refreshOrderStatus: () => void;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export const OrderStatusProvider = ({ children }: { children: ReactNode }) => {
    const { supabase, user } = useSupabase();
    const userId = user && !user.is_anonymous ? user.id : null;

    const { data: hasReadyOrder, mutate } = useSWR(
        userId ? (['order-ready', userId] as const) : null,
        async ([, uid]) => {
            const { count, error } = await supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', uid)
                .eq('status', 'READY')
                .is('pickup_notified_at', null);
            if (error) throw error;
            return (count ?? 0) > 0;
        }
    );

    // Only this customer's orders: the filter runs on the realtime server, so
    // nothing about anyone else's order is sent to this browser.
    useRealtime(
        'order-ready',
        userId ? [{ table: 'orders', event: 'UPDATE', filter: `user_id=eq.${userId}` }] : null,
        () => mutate()
    );

    const refreshOrderStatus = useCallback(() => { mutate(); }, [mutate]);

    const value = useMemo(() => ({
        hasReadyOrder: hasReadyOrder ?? false,
        refreshOrderStatus,
    }), [hasReadyOrder, refreshOrderStatus]);

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
