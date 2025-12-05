

"use client";
import Header from "@/components/Header";
import { CartProvider, useCart } from "@/context/CartContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { usePathname } from 'next/navigation';

function CartSuccessDialog() {
    const { addedItemPopup, setAddedItemPopup } = useCart();

    return (
        <Dialog open={!!addedItemPopup} onOpenChange={(isOpen) => !isOpen && setAddedItemPopup(null)}>
            <DialogContent className="max-w-xs rounded-2xl">
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

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const noHeaderPages = ['/cart', '/checkout'];
    const showHeader = !noHeaderPages.includes(pathname);

    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
                {children}
                </main>
            </div>
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
