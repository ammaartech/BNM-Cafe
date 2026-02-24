"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, IndianRupee, Clock } from "lucide-react";
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

export function CashierPendingQueue() {
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
            .channel("cashier-pending-orders")
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

    const handleApprove = async (orderId: string, displayId: string) => {
        if (!supabase) return;

        setApprovingIds(prev => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
        });

        try {
            const { error } = await supabase
                .from("orders")
                .update({ payment_status: "PAID" })
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

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative group">
                    <Bell className="h-5 w-5" />
                    {pendingOrders.length > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse"
                        >
                            {pendingOrders.length}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="flex flex-col w-full sm:max-w-md overflow-hidden bg-muted/20">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        Pending Payments
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {loading && pendingOrders.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Clock className="h-10 w-10 mb-2 opacity-20" />
                            <p>No pending payments</p>
                        </div>
                    ) : (
                        pendingOrders.map((order) => (
                            <Card key={order.id} className="shadow-sm border-l-4 border-l-orange-500">
                                <CardContent className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">#{order.display_order_id}</h3>
                                            <p className="text-sm font-medium">{order.user_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                                            </p>
                                            <p className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                                        onClick={() => handleApprove(order.id, order.display_order_id)}
                                        disabled={approvingIds.has(order.id)}
                                    >
                                        {approvingIds.has(order.id) ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                        ) : (
                                            "Payment Collected"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
