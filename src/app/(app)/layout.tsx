import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
          {children}
        </main>
      </div>
    </CartProvider>
  );
}
