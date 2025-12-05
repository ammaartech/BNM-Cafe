"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ShoppingCart, Menu as MenuIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";


const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "My Orders" },
];

export default function MenuCategoriesPage() {
  const { totalItems } = useCart();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
      if(auth) {
        await signOut(auth);
      }
      router.push('/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
            Order Now
            </h1>
            <p className="text-muted-foreground">
            Our menu is below
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
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

      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const categoryImage = PlaceHolderImages.find(
            (img) => img.id === category.image
          );
          return (
            <Link
              href={`/menu/${category.id}`}
              key={category.id}
              className="group"
            >
              <Card className="overflow-hidden h-full flex items-center transition-all duration-300 hover:shadow-md hover:border-primary/50">
                {categoryImage && (
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                      src={categoryImage.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      data-ai-hint={categoryImage.imageHint}
                    />
                  </div>
                )}
                <CardHeader className="flex-grow">
                    <CardTitle className="font-semibold text-lg">
                      {category.name}
                    </CardTitle>
                  <CardDescription className="text-sm">{category.description}</CardDescription>
                </CardHeader>
                <div className="p-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
