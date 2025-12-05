
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  
  // These pages have their own header elements or don't need the global header
  const noHeaderPages = ['/cart', '/checkout', '/login', '/register'];
  if (noHeaderPages.includes(pathname)) {
    return null;
  }
  
  // The item detail page has a custom back button and layout
  if (pathname.startsWith('/menu/') && pathname.split('/').length > 3) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 relative">
        
        <Link href="/menu" className="flex items-center gap-2">
            <Utensils className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">
                B.N.M Cafe
            </span>
        </Link>
        
      </div>
    </header>
  );
}
