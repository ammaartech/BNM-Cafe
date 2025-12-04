"use client";

import { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCollection, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/lib/types";
import { ShoppingBag } from "lucide-react";
import Link from 'next/link';

function OrderSkeleton() {
    return (
        <div className="space-y-4">
            <div className="border-b">
                <div className="flex justify-between w-full pr-4 items-center py-4">
                    <div className="space-y-2 text-left">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
            </div>
             <div className="border-b">
                <div className="flex justify-between w-full pr-4 items-center py-4">
                    <div className="space-y-2 text-left">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'orders'),
        orderBy('orderDate', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(userOrdersQuery);

  const isLoading = isUserLoading || isOrdersLoading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">
          Order History
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Review your past orders from Campus Cafe Connect.
        </p>
      </div>

      {isLoading ? (
         <OrderSkeleton />
      ) : !orders || orders.length === 0 ? (
         <div className="text-center py-16 bg-muted/50 rounded-lg">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-semibold">You have no past orders.</p>
            <p className="text-sm text-muted-foreground mt-2">All your future orders will appear here.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
            <AccordionItem key={order.id} value={order.id}>
                <AccordionTrigger>
                <div className="flex justify-between w-full pr-4 items-center">
                    <div className="text-left">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                            <p className="font-semibold text-primary">Order #{order.id.slice(0, 7)}</p>
                        </Link>
                        <p className="text-sm text-muted-foreground">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                          className={cn(order.status === 'Delivered' && 'bg-green-600 text-white')}>
                            {order.status}
                        </Badge>
                        <p className="font-bold mt-1">${order.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="divide-y bg-muted/50 p-4 rounded-md">
                        {order.items.map((item, index) => (
                            <li key={index} className="py-2 flex justify-between">
                                <div>
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-muted-foreground text-sm"> (x{item.quantity})</span>
                                </div>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}
