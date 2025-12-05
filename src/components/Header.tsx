
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Pages that have their own custom header or no header
  const noHeaderPages = ['/login', '/register', '/', '/menu', '/admin'];
  if (noHeaderPages.some(p => pathname.startsWith(p))) {
    return null;
  }
  
  const isItemDetailPage = /^\/menu\/.+\/.+$/.test(pathname);
  if(isItemDetailPage) {
    return null;
  }
  
  const showBackArrow = !['/cart', '/checkout', '/orders'].includes(pathname);
  const titleMap: {[key: string]: string} = {
    '/cart': 'My Cart',
    '/checkout': 'Checkout',
    '/orders': 'My Orders'
  }
  const title = titleMap[pathname] || 'B.N.M Cafe';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        <div className="absolute left-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
        </div>

        <div className="flex-1 text-center">
            <h1 className="text-xl font-semibold">
                {title}
            </h1>
        </div>
        <div className="w-10"></div>
      </div>
    </header>
  );
}
