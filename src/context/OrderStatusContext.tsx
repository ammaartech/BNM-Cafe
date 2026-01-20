
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';

interface OrderStatus {
    id: string;
    status: "Pending" | "Ready for Pickup" | "Delivered" | "Cancelled";
}

interface OrderStatusContextType {
  hasReadyOrder: boolean;
  fetchOrdersStatus: (userId: string) => Promise<void>;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export const OrderStatusProvider = ({ children }: { children: ReactNode }) => {
    const { supabase, user, isUserLoading } = useSupabase();
    const [ordersStatus, setOrdersStatus] = useState<OrderStatus[]>([]);

    const fetchOrdersStatus = useCallback(async (userId: string) => {
        if (!supabase) return;

        const { data, error } = await supabase
            .from('orders')
            .select('id, status')
            .eq('user_id', userId)
            .in('status', ['Pending', 'Ready for Pickup']);

        if (!error) {
            setOrdersStatus(data || []);
        }
    }, [supabase]);

    useEffect(() => {
        if (!isUserLoading && user) {
            fetchOrdersStatus(user.id);
        } else if (!isUserLoading && !user) {
            setOrdersStatus([]);
        }
    }, [user, isUserLoading, fetchOrdersStatus]);

    const hasReadyOrder = ordersStatus.some(order => order.status === 'Ready for Pickup');

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
