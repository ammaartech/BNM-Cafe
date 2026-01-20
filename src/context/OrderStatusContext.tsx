
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';

interface OrderStatusContextType {
  hasReadyOrder: boolean;
  fetchOrdersStatus: (userId: string) => Promise<void>;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export const OrderStatusProvider = ({ children }: { children: ReactNode }) => {
    const { supabase, user, isUserLoading } = useSupabase();
    const [hasReadyOrder, setHasReadyOrder] = useState(false);

    const fetchOrdersStatus = useCallback(async (userId: string) => {
        if (!supabase) return;

        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'Ready for Pickup');
        
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
    }, [user, isUserLoading, fetchOrdersStatus]);

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
