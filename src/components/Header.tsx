"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Utensils, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "My Orders" },
];

export default function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  
  const handleLogout = async () => {
      await signOut(auth);
      router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/menu" className="flex items-center gap-2">
          <Utensils className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-headline text-foreground">
            Campus Cafe Connect
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
           {user && <Link
              href="/admin"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Admin
            </Link>}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                { user ? (
                    <>
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                       <Link href="/admin"><LayoutDashboard className="mr-2"/>Admin</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2"/> Logout
                    </DropdownMenuItem>
                    </>
                ) : (
                    <>
                    <DropdownMenuItem asChild>
                        <Link href="/login">Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/register">Sign Up</Link>
                    </DropdownMenuItem>
                    </>
                )
                }
              </DropdownMenuContent>
            </DropdownMenu>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 p-6">
                    <Link href="/menu" className="flex items-center gap-2 mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                        <Utensils className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold font-headline text-foreground">
                            Campus Cafe
                        </span>
                    </Link>
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "text-lg font-medium transition-colors hover:text-primary",
                          pathname === link.href ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {user && <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                          "text-lg font-medium transition-colors hover:text-primary",
                          pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                      Admin
                    </Link>}
                  </nav>
                  <div className="border-t pt-6">
                    {user ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-muted-foreground">{user.email}</p>
                            <Button onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}}>Logout</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Button asChild onClick={() => setIsMobileMenuOpen(false)}><Link href="/login">Login</Link></Button>
                            <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}><Link href="/register">Sign Up</Link></Button>
                        </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
