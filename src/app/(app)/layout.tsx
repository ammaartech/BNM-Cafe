
"use client";
import { useCart, CartProvider } from "@/context/CartContext";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Home, ShoppingCart, ClipboardList, Heart } from "lucide-react";


function CartSuccessDialog() {
    const { addedItemPopup, setAddedItemPopup } = useCart();

    return (
        <Dialog open={!!addedItemPopup} onOpenChange={(isOpen) => !isOpen && setAddedItemPopup(null)}>
            <DialogContent className="max-w-xs rounded-2xl p-0">
                 <DialogHeader className="flex flex-col items-center justify-center text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <DialogTitle className="text-xl font-semibold">Added to Cart</DialogTitle>
                    {addedItemPopup && (
                        <DialogDescription className="text-muted-foreground">{addedItemPopup.name}</DialogDescription>
                    )}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

function BottomNavBar() {
    const pathname = usePathname();
    const { totalItems } = useCart();
    const { favoriteIds } = useUserPreferences();

    const navItems = [
        { href: '/menu', icon: Home, label: 'Home' },
        { href: '/orders', icon: ClipboardList, label: 'My Orders' },
        { href: '/menu?filter=favorites', icon: Heart, label: 'Favorites', badge: favoriteIds.length > 0 ? favoriteIds.length : null },
        { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems > 0 ? totalItems : null },
    ];
    
    const noNavPages = ['/admin'];
     if (noNavPages.some(p => pathname.startsWith(p))) {
        return null;
    }

    // Hide nav bar on item detail pages
    if (/^\/menu\/.+\/.+$/.test(pathname)) {
        return null;
    }

    return (
        <nav className="sticky bottom-0 z-50 bg-card border-t mt-auto">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link href={item.href} key={item.href} className="relative">
                             <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                <item.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="absolute top-0 right-[-8px] flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const noPaddingPages = ['/menu', '/admin', '/profile'];
    const addPadding = !noPaddingPages.some(p => pathname.startsWith(p)) && !/^\/menu\/.+\/.+$/.test(pathname);
    
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
    <UserPreferencesProvider>
        <CartProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </CartProvider>
    </UserPreferencesProvider>
  );
}
