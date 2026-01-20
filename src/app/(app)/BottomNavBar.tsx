
'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, ShoppingCart, ClipboardList, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { useOrderStatus } from "@/context/OrderStatusContext";

export default function BottomNavBar() {
    const pathname = usePathname();
    const { totalItems } = useCart();
    const { hasReadyOrder } = useOrderStatus();
    const searchParams = useSearchParams();

    const navItems = [
        { href: '/menu', icon: Home, label: 'Home' },
        { href: '/orders', icon: ClipboardList, label: 'My Orders' },
        { href: '/menu?filter=favorites', icon: Heart, label: 'Favorites' },
        { href: '/cart', icon: ShoppingCart, label: 'Cart' },
    ];
    
    const noNavPages = ['/admin', '/profile'];
     if (noNavPages.some(p => pathname.startsWith(p))) {
        return null;
    }

    if (/^\/menu\/.+\/.+$/.test(pathname)) {
        return null;
    }

    return (
        <nav className="sticky bottom-0 z-50 bg-card border-t mt-auto">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isFavoritesActive = item.label === 'Favorites' && pathname === '/menu' && searchParams.get('filter') === 'favorites';
                    const isHomeActive = item.label === 'Home' && pathname === '/menu' && !searchParams.get('filter');
                    const isActive = pathname === item.href || isFavoritesActive || isHomeActive;

                    const Icon = item.icon;
                    const shouldFill = isActive && (item.label === 'Favorites' || item.label === 'Cart');

                    return (
                        <Link href={item.href} key={item.href} className="relative">
                             <div className={cn('flex flex-col items-center gap-1', isActive ? 'text-primary' : 'text-muted-foreground')}>
                                <Icon className={cn(
                                    "h-6 w-6",
                                    shouldFill && "fill-current"
                                 )} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                            {item.label === 'Cart' && totalItems > 0 && (
                                <span className="absolute top-[-4px] right-[-6px] flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    {totalItems}
                                </span>
                            )}
                            {item.label === 'My Orders' && hasReadyOrder && (
                                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}
