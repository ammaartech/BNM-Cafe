"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/provider";
import { categories } from "@/lib/data";
import { MenuItem } from "@/lib/types";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

import { CashierProvider, useCashier } from "@/context/CashierContext";
import { CategoryTabs } from "@/components/cashier/CategoryTabs";
import { MenuGrid } from "@/components/cashier/MenuGrid";
import { OrderSidebar } from "@/components/cashier/OrderSidebar";
import { ReceiptTemplate } from "@/components/cashier/ReceiptTemplate";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { PendingOrdersGrid } from "@/components/cashier/PendingOrdersGrid";
import { Badge } from "@/components/ui/badge";

/* ---------------- INNER COMPONENT ---------------- */

function CashierPageContent() {
    const { addToBill } = useCashier();
    const { supabase, user, userProfile, isUserLoading } = useSupabase();
    const router = useRouter();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingCount, setPendingCount] = useState(0);

    // --- AUTH CHECK ---
    useEffect(() => {
        if (!isUserLoading && (!user || userProfile?.role !== "admin")) {
            // router.push("/station"); // Or login page
        }
    }, [user, userProfile, isUserLoading, router]);

    // --- FETCH DATA ---
    useEffect(() => {
        async function fetchItems() {
            if (!supabase) return;
            setLoading(true);
            const { data, error } = await supabase
                .from("menu_items")
                .select("*")
                .order("name");

            if (error) {
                console.error("Error fetching menu:", error);
            } else {
                setMenuItems(data as MenuItem[]);
            }
            setLoading(false);
        }
        fetchItems();
    }, [supabase]);

    // --- FETCH PENDING COUNT ---
    useEffect(() => {
        if (!supabase) return;

        async function fetchCount() {
            const { count } = await supabase
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("payment_status", "PENDING");
            setPendingCount(count || 0);
        }

        fetchCount();

        const channel = supabase.channel('pending-count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchCount();
            }).subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [supabase]);


    // --- AUTH GUARD RENDER ---
    if (isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // 1. If not logged in at all, show Admin Login
    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-center mb-6">Cashier Access</h1>
                    <AdminLogin />
                    <div className="mt-4 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" asChild className="mt-4 w-full">
                            <Link href="/station">Go to Station Login</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. If logged in but NOT admin, show Access Denied
    if (userProfile?.role !== "admin") {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You must be an admin to access the cashier interface.
                        <br />
                        Current role: {userProfile?.role || 'Unknown'}
                    </AlertDescription>
                    <div className="mt-4 flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/station">Station Login</Link>
                        </Button>
                        <Button variant="outline" onClick={() => supabase?.auth.signOut()}>
                            Logout
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }


    // --- FILTER LOGIC ---
    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex h-screen overflow-hidden">
            {/* LEFT SIDE: MENU */}
            <div className="flex-grow flex flex-col h-full overflow-hidden relative">
                <header className="p-4 border-b flex items-center justify-between bg-background z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Cashier</h1>
                            <p className="text-muted-foreground text-sm">
                                {userProfile?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-1/3 justify-end">
                        <div className="w-full">
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="w-full p-2 border rounded-md bg-muted/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="p-4 bg-muted/10 flex items-center gap-4 border-b">
                    <div className="flex-grow">
                        <CategoryTabs
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />
                    </div>

                    <Button
                        variant={selectedCategory === "pending" ? "default" : "outline"}
                        onClick={() => setSelectedCategory("pending")}
                        className="rounded-full relative shrink-0 whitespace-nowrap bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 hover:text-orange-900 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600 data-[state=active]:hover:bg-orange-700 h-10 px-6 font-semibold"
                        data-state={selectedCategory === "pending" ? "active" : "inactive"}
                    >
                        Pending Payments
                        {pendingCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse bg-red-600 hover:bg-red-700 text-white border-0 z-10">
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                </div>

                <div className="flex-grow overflow-y-auto bg-muted/10">
                    {selectedCategory === "pending" ? (
                        <PendingOrdersGrid />
                    ) : loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <MenuGrid items={filteredItems} onAddItem={addToBill} />
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: ORDER SIDEBAR */}
            <div className="w-[400px] h-full flex-shrink-0 shadow-xl z-20">
                <OrderSidebar />
            </div>

            {/* HIDDEN RECEIPT TEMPLATE */}
            <ReceiptTemplate />
        </div>
    );
}

/* ---------------- WRAPPER ---------------- */

export default function CashierPage() {
    return (
        <CashierProvider>
            <CashierPageContent />
        </CashierProvider>
    );
}
