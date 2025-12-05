

"use client";
import { useCart, CartProvider } from "@/context/CartContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ShoppingCart, User, Heart } from "lucide-react";

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

function BottomNavBar() {
    const pathname = usePathname();
    const navItems = [
        { href: '/menu', icon: Home, label: 'Home' },
        { href: '/orders', icon: Heart, label: 'Orders' },
        { href: '/cart', icon: ShoppingCart, label: 'Cart' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];
    
    // Don't show nav bar on certain pages
    const noNavPages = ['/login', '/register', '/admin2'];
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
    const noPaddingPages = ['/menu', '/login', '/register'];
    const addPadding = !noPaddingPages.some(p => pathname.startsWith(p));
    
    return (
        <>
            <main className={`flex flex-col flex-grow ${addPadding ? 'container mx-auto px-4 py-6' : ''}`}>
                {children}
            </main>
            <BottomNavBar />
            <CartSuccessDialog />
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
      <AppLayoutContent>{children}</AppLayoutContent>
    </CartProvider>
  );
}
