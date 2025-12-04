"use client";

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useParams } from "next/navigation";
import type { Order, OrderItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, ShoppingBag, User as UserIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function TicketSkeleton() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                     <div>
                        <Skeleton className="h-4 w-12 mb-2" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                </div>
                 <Separator />

                <div>
                     <Skeleton className="h-5 w-24 mb-4" />
                     <div className="space-y-4">
                        <div className="flex justify-between items-center"><Skeleton className="h-5 w-40" /> <Skeleton className="h-5 w-16" /></div>
                        <div className="flex justify-between items-center"><Skeleton className="h-5 w-32" /> <Skeleton className="h-5 w-16" /></div>
                     </div>
                </div>

                <Separator />
                 <div className="flex justify-end">
                    <div className="w-1/2 space-y-3">
                         <div className="flex justify-between"><Skeleton className="h-4 w-20" /> <Skeleton className="h-4 w-16" /></div>
                         <div className="flex justify-between"><Skeleton className="h-4 w-24" /> <Skeleton className="h-4 w-12" /></div>
                         <div className="flex justify-between"><Skeleton className="h-5 w-16" /> <Skeleton className="h-5 w-20" /></div>
                    </div>
                 </div>

            </CardContent>
        </Card>
    );
}


export default function OrderTicketPage() {
  const { orderId } = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !user || !orderId) return null;
    return doc(firestore, `users/${user.uid}/orders/${orderId}`);
  }, [firestore, user, orderId]);

  const { data: order, isLoading, error } = useDoc<Order>(orderRef);

  if (isLoading || isUserLoading) {
    return <TicketSkeleton />;
  }

  if (error) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message || "Failed to fetch order details."}</AlertDescription>
        </Alert>
    );
  }
  
  if (!order) {
     return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>The requested order could not be found.</AlertDescription>
        </Alert>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary"/>
            <div>
                <CardTitle className="text-2xl font-bold">Order Ticket</CardTitle>
                <CardDescription>Order ID: #{order.id.slice(0, 7)}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
                <dt className="text-muted-foreground font-semibold">Order Date</dt>
                <dd className="mt-1 font-medium">{new Date(order.orderDate).toLocaleString()}</dd>
            </div>
             <div>
                <dt className="text-muted-foreground font-semibold">Status</dt>
                <dd className="mt-1">
                     <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                          className={cn('font-semibold', order.status === 'Delivered' && 'bg-green-600 text-white')}>
                            {order.status}
                        </Badge>
                </dd>
            </div>
            <div>
                <dt className="text-muted-foreground font-semibold">Total</dt>
                <dd className="mt-1 font-bold text-lg text-primary">${order.totalAmount.toFixed(2)}</dd>
            </div>
        </div>

        <Separator />

        <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="h-5 w-5"/>Items</h3>
            <ul className="space-y-3">
                {order.items.map((item: OrderItem, index: number) => (
                    <li key={index} className="flex justify-between items-baseline">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {item.quantity} x ${item.price.toFixed(2)}
                            </p>
                        </div>
                        <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                    </li>
                ))}
            </ul>
        </div>
        
        <Separator />

        <div className="flex justify-end">
            <div className="w-full sm:w-1/2 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span className="font-medium">$0.00</span>
                </div>
                 <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
