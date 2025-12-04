import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { orders } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
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

      {orders.length === 0 ? (
         <div className="text-center py-16">
            <p className="text-muted-foreground">You have no past orders.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => (
            <AccordionItem key={order.id} value={order.id}>
                <AccordionTrigger>
                <div className="flex justify-between w-full pr-4 items-center">
                    <div className="text-left">
                        <p className="font-semibold text-primary">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">Date: {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                          className={cn(order.status === 'Delivered' && 'bg-green-600 text-white')}>
                            {order.status}
                        </Badge>
                        <p className="font-bold mt-1">${order.total.toFixed(2)}</p>
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
