

'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Metadata cannot be exported from a client component.
// We can define it statically here for the root layout.
// export const metadata: Metadata = {
//   title: "B.N.M Cafe",
//   description: "Your university cafe companion",
// };

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isAdminPage = pathname.startsWith('/admin');
    const isStaffPage = pathname.startsWith('/staff');
    const isAuthPage = pathname === '/';

    const layoutClass = () => {
        if (isStaffPage) return 'w-full max-w-full';
        if (isAdminPage) return 'max-w-7xl';
        if (isAuthPage) return 'w-full';
        return 'max-w-md shadow-2xl';
    }

    return (
        <html lang="en" className={cn(isStaffPage && 'dark')} suppressHydrationWarning>
            <head>
                <title>B.N.M Cafe</title>
                <meta name="description" content="Your university cafe companion" />
            </head>
            <body className={`font-sans antialiased ${inter.variable}`}>
                <div className={cn(
                    "mx-auto bg-background min-h-dvh flex flex-col",
                    layoutClass()
                )}>
                    <SupabaseProvider>
                        {children}
                    </SupabaseProvider>
                    <Toaster />
                </div>
            </body>
        </html>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}
