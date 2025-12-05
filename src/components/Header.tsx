
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Utensils, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  const noHeaderPages = ['/cart', '/checkout'];
  const isNoHeaderPage = noHeaderPages.includes(pathname);
  
  const isMenuItemPage = pathname.startsWith('/menu/') && pathname.split('/').length > 3;

  if (isMenuItemPage || isNoHeaderPage) {
    return null;
  }
  
  const showBackArrow = pathname.startsWith('/menu/') || pathname.startsWith('/orders/');


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center px-4 relative">
        
        <div className="absolute left-4 flex items-center">
            {showBackArrow && !pathname.startsWith('/menu/category') ? (
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            ) : null}
             {!showBackArrow && (
                 <Link href="/menu" className="flex items-center gap-2">
                    <Utensils className="h-7 w-7 text-primary" />
                </Link>
            )}
        </div>

        <div className="mx-auto flex items-center gap-2">
             <Link href="/menu" className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                    B.N.M Cafe
                </span>
            </Link>
        </div>

      </div>
    </header>
  );
}
