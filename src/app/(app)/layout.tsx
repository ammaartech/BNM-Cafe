

"use client";
import { useCart, CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { CheckCircle, ClipboardList, PackageCheck } from "lucide-react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ShoppingCart, User, Heart } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { useState, useEffect } from "react";

function CartSuccessDialog() {
    const { addedItemPopup, setAddedItemPopup } = useCart();

    return (
        <Dialog open={!!addedItemPopup} onOpenChange={(isOpen) => !isOpen && setAddedItemPopup(null)}>
            <DialogContent className="max-w-xs rounded-2xl p-0">
                 <div className="flex flex-col items-center justify-center text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-xl font-semibold">Added to Cart</h2>
                    {addedItemPopup && (
                        <p className="text-muted-foreground">{addedItemPopup.name}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function OrderReadyNotifier() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [notifiedOrderIds, setNotifiedOrderIds] = useState<string[]>([]);
    const [orderReady, setOrderReady] = useState<Order | null>(null);

    const readyOrdersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'users', user.uid, 'orders'),
            where('status', '==', 'Ready for Pickup')
        );
    }, [user, firestore]);

    const { data: readyOrders } = useCollection<Order>(readyOrdersQuery);

    useEffect(() => {
        if (readyOrders && readyOrders.length > 0) {
            const newReadyOrder = readyOrders.find(order => !notifiedOrderIds.includes(order.id));
            if (newReadyOrder) {
                setOrderReady(newReadyOrder);
                setNotifiedOrderIds(prev => [...prev, newReadyOrder.id]);
            }
        }
    }, [readyOrders, notifiedOrderIds]);

    const handleClose = () => {
        setOrderReady(null);
    }

    return (
        <Dialog open={!!orderReady} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-xs rounded-2xl">
                <DialogHeader className="text-center items-center">
                    <PackageCheck className="h-16 w-16 text-primary mb-4" />
                    <DialogTitle className="text-xl font-bold">Your Order is Ready!</DialogTitle>
                    <DialogDescription>
                        Order #{orderReady?.id.slice(0, 7)} is now ready for pickup at B.N.M Cafe.
                    </DialogDescription>
                </DialogHeader>
                <Button onClick={handleClose}>Got it!</Button>
                 <Button variant="outline" asChild onClick={handleClose}>
                    <Link href="/orders">View My Orders</Link>
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function BottomNavBar() {
    const pathname = usePathname();
    const navItems = [
        { href: '/menu', icon: Home, label: 'Home' },
        { href: '/orders', icon: ClipboardList, label: 'My Orders' },
        { href: '/profile/favorites', icon: Heart, label: 'Favorites' },
        { href: '/cart', icon: ShoppingCart, label: 'Cart' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];
    
    // Don't show nav bar on certain pages
    const noNavPages = ['/login', '/register', '/admin'];
     if (noNavPages.some(p => pathname.startsWith(p))) {
        return null;
    }

    return (
        <nav className="sticky bottom-0 z-50 bg-card border-t mt-auto">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link href={item.href} key={item.href}>
                             <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                <item.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const noPaddingPages = ['/menu', '/login', '/register', '/admin', '/profile'];
    const addPadding = !noPaddingPages.some(p => pathname.startsWith(p));
    
    return (
        <>
            <main className={`flex flex-col flex-grow ${addPadding ? 'container mx-auto px-4 py-6' : ''}`}>
                {children}
            </main>
            <BottomNavBar />
            <CartSuccessDialog />
            <OrderReadyNotifier />
        </>
    );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <FavoritesProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </FavoritesProvider>
    </CartProvider>
  );
}
