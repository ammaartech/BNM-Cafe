
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { usePathname } from 'next/navigation';

interface OrderStatusContextType {
  hasReadyOrder: boolean;
  fetchOrdersStatus: (userId: string) => Promise<void>;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export const OrderStatusProvider = ({ children }: { children: ReactNode }) => {
    const { supabase, user, isUserLoading } = useSupabase();
    const [hasReadyOrder, setHasReadyOrder] = useState(false);
    const pathname = usePathname();

    const fetchOrdersStatus = useCallback(async (userId: string) => {
        if (!supabase) return;

        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'READY')
            .is('pickup_notified_at', null);
        
        if (!error) {
            setHasReadyOrder((count || 0) > 0);
        }
    }, [supabase]);

    useEffect(() => {
        if (!isUserLoading && user) {
            fetchOrdersStatus(user.id);
        } else if (!isUserLoading && !user) {
            setHasReadyOrder(false);
        }
    }, [user, isUserLoading, fetchOrdersStatus, pathname]);
    
    const handleRealtimeUpdate = useCallback((payload: any) => {
        if (user && payload.new.user_id === user.id) {
            if (payload.new.status === 'READY' && payload.new.pickup_notified_at === null) {
                setHasReadyOrder(true);
            } else {
                // Re-fetch to get the accurate count for all states, especially after pickup or cancellation
                fetchOrdersStatus(user.id);
            }
        }
    }, [user, fetchOrdersStatus]);
    
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


    const value = {
        hasReadyOrder,
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
