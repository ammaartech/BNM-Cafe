
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingBag, Package, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


function OrdersSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-5 w-20 ml-auto" />
                                <Skeleton className="h-6 w-24 ml-auto" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    const { user, supabase } = useSupabase();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('order_date', { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
                setError("Failed to load your orders. Please try again.");
            } else {
                const formattedOrders: Order[] = data.map((d: any) => ({
                    ...d,
                    orderDate: d.order_date,
                    totalAmount: d.total_amount,
                    userName: d.user_name,
                    items: [], // Items are not needed for this list view
                }));
                setOrders(formattedOrders);
            }
            setIsLoading(false);
        };

        fetchOrders();
    }, [user, supabase]);

    if (isLoading) {
        return <OrdersSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <Package className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Orders Yet</h3>
                    <p className="text-muted-foreground mt-2">You haven't placed any orders.</p>
                    <Button asChild className="mt-6">
                        <Link href="/menu">Start Ordering</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 flex-grow">
                    {orders.map(order => (
                        <Link href={`/orders/${order.id}`} key={order.id} className="block">
                             <Card className="hover:bg-muted transition-colors">
                                <CardContent className="p-4">
                                     <div className="flex justify-between items-center">
                                        <div className="grid gap-1">
                                            <p className="font-semibold text-sm">Order #{order.id.slice(0, 7)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <Badge
                                                variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                                                className={cn('font-semibold w-fit mt-1', {
                                                    'bg-green-600 text-white': order.status === 'Delivered',
                                                    'bg-yellow-500 text-white': order.status === 'Ready for Pickup',
                                                })}
                                            >
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">₹{order.totalAmount.toFixed(2)}</span>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CardContent>
                             </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
