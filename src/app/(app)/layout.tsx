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
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-card text-card-foreground border-t">
            <div className="container mx-auto py-4 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Campus Cafe Connect. All rights reserved.</p>
            </div>
        </footer>
      </div>
    </CartProvider>
  );
}
