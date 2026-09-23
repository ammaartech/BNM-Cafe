
"use client";
import { useCart, CartProvider } from "@/context/CartContext";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { Suspense, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPreferences, UserPreferencesProvider } from "@/context/UserPreferencesContext";
import BottomNavBar from "./BottomNavBar";
import { useSupabase } from "@/lib/supabase/provider";
import { OrderStatusProvider, useOrderStatus } from "@/context/OrderStatusContext";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { PlaceHolderImages } from "@/lib/placeholder-images";

function CartSuccessDialog() {
    const { addedItemPopup, setAddedItemPopup } = useCart();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (addedItemPopup) {
            const timer = setTimeout(() => {
                setAddedItemPopup(null);
            }, 2500); // 2.5 seconds to read
            return () => clearTimeout(timer);
        }
    }, [addedItemPopup, setAddedItemPopup]);

    const itemImage = addedItemPopup ? PlaceHolderImages.find((img) => img.id === addedItemPopup.image) : null;

    return (
        <div className="fixed left-0 right-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex justify-center pointer-events-none px-4">
            <AnimatePresence>
                {addedItemPopup && (
                    <motion.div
                        role="status"
                        aria-live="polite"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -50, scale: 0.9 }}
                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={
                            shouldReduceMotion
                                ? { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
                                : { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
                        }
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                        }}
                        onClick={() => setAddedItemPopup(null)}
                        className="bg-card border shadow-lg rounded-2xl p-3 pr-4 flex items-center gap-3 w-full max-w-sm pointer-events-auto cursor-pointer"
                    >
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                            {itemImage ? (
                                <Image
                                    src={itemImage.imageUrl}
                                    alt={addedItemPopup.name}
                                    fill
                                    sizes="(max-width: 48px) 100vw, 48px"
                                    className="object-cover"
                                    data-ai-hint={itemImage.imageHint}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-xs font-medium text-muted-foreground leading-tight">
                                Added to cart
                            </p>
                            <p className="text-sm font-semibold leading-snug truncate mt-0.5">
                                {addedItemPopup.name}
                            </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
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
    // SWR natively handles tab synchronization and visibility changes via revalidateOnFocus.
    // We no longer need manual visibility change listeners here!

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
