
"use client";
import { useCart, CartProvider } from "@/context/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { Suspense, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPreferences, UserPreferencesProvider } from "@/context/UserPreferencesContext";
import BottomNavBar from "./BottomNavBar";
import { useSupabase } from "@/lib/supabase/provider";
import { OrderStatusProvider, useOrderStatus } from "@/context/OrderStatusContext";

function CartSuccessDialog() {
    const { addedItemPopup, setAddedItemPopup } = useCart();

    useEffect(() => {
        if (addedItemPopup) {
            const timer = setTimeout(() => {
                setAddedItemPopup(null);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [addedItemPopup, setAddedItemPopup]);

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

function NavSkeleton() {
    return (
         <div className="sticky bottom-0 z-50 bg-card border-t mt-auto">
            <div className="flex justify-around items-center h-16">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <Skeleton className="h-6 w-6 rounded-md" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))}
            </div>
        </div>
    )
}


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user } = useSupabase();
    const { fetchCart } = useCart();
    const { fetchFavorites } = useUserPreferences();
    const { fetchOrdersStatus } = useOrderStatus();
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                // Soft re-fetch data when the app becomes visible again
                fetchCart(user.id);
                fetchFavorites(user.id);
                fetchOrdersStatus(user.id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, fetchCart, fetchFavorites, fetchOrdersStatus]);

    return (
        <>
            <main className="flex flex-col flex-grow">
                {children}
            </main>
            <Suspense fallback={<NavSkeleton />}>
                <BottomNavBar />
            </Suspense>
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
      <UserPreferencesProvider>
        <OrderStatusProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </OrderStatusProvider>
      </UserPreferencesProvider>
    </CartProvider>
  );
}
