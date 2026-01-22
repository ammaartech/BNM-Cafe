
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CookingPot } from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration purposes
const mockOrders = [
    {
        id: 'A-022',
        userName: 'Anika Reddy',
        orderDate: new Date(),
        status: 'PENDING',
        items: [
            { quantity: 2, name: 'Pani Puri' },
            { quantity: 1, name: 'Dahi Puri' },
        ]
    },
    {
        id: 'A-024',
        userName: 'Vikram Kumar',
        orderDate: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        status: 'PENDING',
        items: [
            { quantity: 1, name: 'Chai' },
            { quantity: 1, name: 'Coffee' },
        ]
    },
];

// Simplified KOT Card for this mock page
function MockKOTCard({ order }: { order: typeof mockOrders[0] }) {
    return (
        <Card className="flex flex-col shadow-lg bg-card rounded-lg w-[300px]">
            <CardHeader className="p-4 bg-muted/50 rounded-t-lg">
                <div className="flex justify-between items-baseline">
                    <CardTitle className="text-2xl font-bold">#{order.id}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">
                        {order.orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <p className="text-sm font-medium">{order.userName}</p>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <ul className="space-y-2">
                    {order.items.map((item, index) => (
                        <li key={index} className="flex text-base items-center">
                            <span className="w-8 text-center font-bold">{item.quantity}x</span>
                            <span className="flex-1 font-semibold">{item.name}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="p-3 border-t flex flex-col items-stretch gap-2">
                 <Badge 
                    className='font-semibold text-sm w-full justify-center py-1.5 bg-blue-500 text-white'
                >
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Pending</span>
                </Badge>
                <div className="flex w-full gap-2">
                    <Button size="sm" variant="destructive" className="w-full">Cancel</Button>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">Mark as Ready</Button>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function StationTwoPage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
      <header className="mb-6 flex justify-between items-center flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Station 2 - Chats & Refreshments
        </h1>
        <Button variant="outline" asChild>
            <Link href="/station">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stations
            </Link>
        </Button>
      </header>
      <main className="flex-grow overflow-y-auto">
        <p className="text-muted-foreground mb-4">Displaying active orders for this station.</p>
        <div className="flex flex-wrap gap-4 items-start">
            {mockOrders.map(order => (
                <MockKOTCard key={order.id} order={order} />
            ))}
        </div>
      </main>
    </div>
  );
}
