"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Utensils, Menu as MenuIcon, X, LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";
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

  // Simple pages without the full header
  const simplePages = ['/cart', '/checkout'];
  const isSimplePage = simplePages.includes(pathname);
  
  const isMenuItemPage = pathname.startsWith('/menu/') && pathname.split('/').length > 3;

  if (isMenuItemPage) {
    return null;
  }
  
  const showBackArrow = pathname.startsWith('/menu/') || pathname.startsWith('/orders/');


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center px-4 relative">
        
        <div className="absolute left-4">
            {showBackArrow && !pathname.startsWith('/menu/category') && !isSimplePage ? (
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            ) : (
                 !isSimplePage && <Link href="/menu" className="flex items-center gap-2">
                    <Utensils className="h-7 w-7 text-primary" />
                </Link>
            )}
             {isSimplePage && (
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            )}
        </div>

        <div className="mx-auto flex items-center gap-2">
             <Link href="/menu" className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                    B.N.M Cafe
                </span>
            </Link>
        </div>

        <div className="absolute right-4 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                { user ? (
                    <>
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {navLinks.map(link => (
                         <DropdownMenuItem key={link.href} asChild>
                           <Link href={link.href}>{link.label}</Link>
                        </DropdownMenuItem>
                    ))}
                     <DropdownMenuItem asChild>
                       <Link href="/admin2"><LayoutDashboard className="mr-2 h-4 w-4"/>Admin</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4"/> Logout
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
        </div>
      </div>
    </header>
  );
}
