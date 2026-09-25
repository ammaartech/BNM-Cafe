"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { TourProvider } from "@/components/tour/TourProvider";
import { SWRProvider } from "@/lib/swr";
import { cn } from "@/lib/utils";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffPage = pathname.startsWith("/admin") || pathname.startsWith("/station");
  const isAuthPage = pathname === "/" || pathname === "/login";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      // Admin and station keep their light look. Customer pages follow the
      // user's choice from Profile > Appearance.
      forcedTheme={isStaffPage ? "light" : undefined}
      disableTransitionOnChange
    >
      <div
        className={cn(
          "mx-auto bg-background min-h-dvh flex flex-col",
          isStaffPage || isAuthPage ? "w-full max-w-full" : "max-w-md shadow-2xl"
        )}
      >
        <SWRProvider>
          <SupabaseProvider>
            <TourProvider>{children}</TourProvider>
          </SupabaseProvider>
        </SWRProvider>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
