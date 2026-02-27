"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Store,
    LogOut,
    UtensilsCrossed,
    MessageSquare
} from "lucide-react";
import { useSupabase } from "@/lib/supabase/provider";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
    {
        title: "Analytics Dashboard",
        href: "/admin/analytics",
        icon: LayoutDashboard,
    },
    {
        title: "Point of Sale (Cashier)",
        href: "/admin/cashier",
        icon: ShoppingCart,
    },
    {
        title: "Station Hub",
        href: "/station",
        icon: Store,
    },
    {
        title: "Feedback",
        href: "/admin/feedback",
        icon: MessageSquare,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { supabase, isUserLoading, user, userProfile } = useSupabase();

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    // If loading or not an admin, we don't render the sidebar so the actual page can handle the login screen
    if (isUserLoading || !user || user.is_anonymous || userProfile?.role !== 'admin') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-muted/20">
            {/* Sidebar (Desktop) */}
            <aside className="hidden w-64 flex-col border-r bg-card shadow-sm md:flex sticky top-0 h-screen">
                <div className="flex h-16 items-center px-6 border-b">
                    <UtensilsCrossed className="h-6 w-6 text-primary mr-2" />
                    <span className="text-lg font-bold tracking-tight">BNM Admin</span>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    {sidebarNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors my-1",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t mt-auto">
                    <div className="mb-4 px-2">
                        <p className="text-sm font-medium leading-none">{userProfile?.name || 'Admin User'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </aside>

            {/* Mobile Header (Sticky visible only on small screens) */}
            <div className="flex h-14 items-center border-b px-4 md:hidden bg-card sticky top-0 z-50">
                <UtensilsCrossed className="h-5 w-5 text-primary mr-2" />
                <span className="font-bold">BNM Admin</span>
                <div className="ml-auto flex gap-2">
                    {sidebarNavItems.map((item) => (
                        <Link key={item.href} href={item.href} className={cn("p-2 rounded-md", pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                            <item.icon className="h-5 w-5" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
