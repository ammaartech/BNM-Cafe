"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PendingOrder {
    id: string;
    display_order_id: string;
    user_name: string;
    total_amount: number;
    order_date: string;
}

export function PendingOrdersGrid() {
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

    const fetchPendingOrders = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);

        // Only fetch orders that are PENDING payment
        const { data, error } = await supabase
            .from("orders")
            .select("id, display_order_id, user_name, total_amount, order_date")
            .eq("payment_status", "PENDING")
            .order("order_date", { ascending: true });

        if (error) {
            console.error("Error fetching pending orders:", error);
        } else {
            setPendingOrders(data || []);
        }

        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchPendingOrders();

        if (!supabase) return;

        // Listen for new orders and updates to existing orders
        const channel: RealtimeChannel = supabase
            .channel("cashier-pending-orders-grid")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    fetchPendingOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchPendingOrders]);

    const handleApprove = async (orderId: string, displayId: string, paymentMethod: "CASH" | "UPI") => {
        if (!supabase) return;

        setApprovingIds(prev => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
        });

        try {
            const { error } = await supabase
                .from("orders")
                .update({ payment_status: "PAID", payment_method: paymentMethod })
                .eq("id", orderId);

            if (error) throw error;

            toast({
                title: "Payment Collected",
                description: `Order #${displayId} has been sent to the stations.`,
            });
            // fetchPendingOrders is handled by the realtime subscription
        } catch (error: any) {
            toast({
                title: "Approval Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    if (loading && pendingOrders.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (pendingOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground h-full">
                <Clock className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-xl">No pending payments</p>
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingOrders.map((order) => (
                <Card key={order.id} className="shadow-md border-t-4 border-t-orange-500">
                    <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">#{order.display_order_id}</h3>
                                <p className="text-sm font-medium">{order.user_name}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                            </span>
                            <span className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</span>
                        </div>

                        {approvingIds.has(order.id) ? (
                            <Button disabled className="w-full h-10 mt-1">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </Button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10"
                                    onClick={() => handleApprove(order.id, order.display_order_id, "CASH")}
                                >
                                    Cash
                                </Button>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10"
                                    onClick={() => handleApprove(order.id, order.display_order_id, "UPI")}
                                >
                                    UPI
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
