
"use client";

import { useSupabase } from "@/lib/supabase/provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, IndianRupee, ShoppingCart, Users, AlertCircle, Download, TrendingUp, TrendingDown, Package, LogIn, LogOut, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import type { Order, OrderItem } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    salesOverTime: { date: string; revenue: number; sales: number }[];
    topProducts: (OrderItem & { revenue: number, unitsSold: number })[];
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-40 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-[300px] w-full" />
                </CardContent>
             </Card>
        </div>
    )
}

const salesChartConfig = {
  revenue: {
    label: "Revenue (₹)",
    color: "hsl(var(--primary))",
  },
  sales: {
    label: "Sales",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const topProductsChartConfig = {
  unitsSold: {
    label: "Units Sold",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


function AdminAnalyticsPage() {
    const { supabase } = useSupabase();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if(!supabase) return;
            setIsLoading(true);
            
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq('status', 'Delivered');
            
            if (ordersError) {
                setError("Failed to fetch order data.");
                console.error(ordersError);
                setIsLoading(false);
                return;
            }

            // 1. Calculate KPIs
            const totalRevenue = ordersData.reduce((acc, order) => acc + (order.total_amount || 0), 0);
            const totalOrders = ordersData.length;
            const totalCustomers = new Set(ordersData.map(o => o.user_id)).size;

            // 2. Aggregate Sales over the last 30 days
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const d = subDays(new Date(), i);
                return format(d, 'yyyy-MM-dd');
            }).reverse();

            const salesByDay = last30Days.map(date => {
                const dayOrders = ordersData.filter(o => format(new Date(o.order_date), 'yyyy-MM-dd') === date);
                return {
                    date: format(new Date(date), 'MMM dd'),
                    revenue: dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
                    sales: dayOrders.length
                };
            });
            
            // 3. Aggregate Top Products
            const productSales = new Map<string, { name: string; unitsSold: number; revenue: number; id: string }>();
            ordersData.forEach(order => {
                (order.order_items || []).forEach((item: any) => {
                    const existing = productSales.get(item.menu_item_id);
                    const itemRevenue = (item.price || 0) * (item.quantity || 0);
                    const itemQuantity = item.quantity || 0;

                    if (itemQuantity === 0) return; // Don't process items with 0 quantity

                    if (existing) {
                        existing.unitsSold += itemQuantity;
                        existing.revenue += itemRevenue;
                    } else if (item.menu_item_id) {
                        productSales.set(item.menu_item_id, {
                            id: item.menu_item_id,
                            name: item.name,
                            unitsSold: itemQuantity,
                            revenue: itemRevenue,
                        });
                    }
                });
            });

            const topProducts = Array.from(productSales.values())
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .map(p => ({ ...p, price: p.unitsSold > 0 ? p.revenue / p.unitsSold : 0, quantity: p.unitsSold }));


            setData({
                totalRevenue,
                totalOrders,
                totalCustomers,
                salesOverTime: salesByDay,
                topProducts
            });
            setIsLoading(false);
        };
        fetchData();
    }, [supabase]);
    
    const downloadCSV = () => {
        if (!data?.topProducts) return;
        
        const headers = ["Product ID", "Product Name", "Units Sold", "Total Revenue (INR)"];
        const rows = data.topProducts.map(p => [p.id, `"${p.name.replace(/"/g, '""')}"`, p.unitsSold, (p.revenue || 0).toFixed(2)]);
        
        let csvContent = headers.join(",") + "\r\n";
        rows.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "top-products-analytics.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (isLoading) return <AnalyticsSkeleton />;
    if (error) return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
    if (!data) return (
        <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>There is no sales data to analyze yet.</AlertDescription>
        </Alert>
    );

    return (
        <div className="space-y-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data.totalRevenue || 0).toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{data.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{data.totalCustomers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(data.totalRevenue / data.totalOrders || 0).toFixed(2)}</div>
                    </CardContent>
                </Card>
             </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={salesChartConfig} className="min-h-[350px] w-full">
                            <LineChart accessibilityLayer data={data.salesOverTime}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                                <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${value}`} />
                                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} yAxisId="left" />
                                <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={false} yAxisId="right" />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Selling Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={topProductsChartConfig} className="min-h-[350px] w-full">
                            <RechartsBarChart accessibilityLayer data={data.topProducts.slice(0, 5)} layout="vertical" margin={{ left: 50 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                                <XAxis dataKey="unitsSold" type="number" hide />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="unitsSold" layout="vertical" fill="var(--color-unitsSold)" radius={4} />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
             
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top Products by Sales</CardTitle>
                    <Button onClick={downloadCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-center">Units Sold</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.topProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-center">{product.unitsSold}</TableCell>
                                    <TableCell className="text-right">₹{(product.revenue || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}

function AdminLoginPage() {
    const { supabase } = useSupabase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        }
        // On success, the main AdminPage component will detect the user and role change, and re-render.
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-full w-full">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Analytics Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Login Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AnalyticsPageContainer() {
    const { user, userProfile, isUserLoading, supabase } = useSupabase();
    const router = useRouter();

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/');
    };

    if (isUserLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const isUserAdmin = user && !user.is_anonymous && userProfile?.role === 'admin';
    
    if (!isUserAdmin) {
        const isUserLoggedInButNotAdmin = user && !user.is_anonymous && userProfile?.role !== 'admin';
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
                <div className="flex-grow flex items-center justify-center">
                    {isUserLoggedInButNotAdmin ? (
                       <Card className="w-full max-w-sm">
                           <CardHeader>
                               <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
                           </CardHeader>
                           <CardContent className="text-center">
                               <Alert variant="destructive" className="mb-4">
                                   <AlertCircle className="h-4 w-4" />
                                   <AlertTitle>Permission Error</AlertTitle>
                                   <AlertDescription>You do not have permission to access the analytics dashboard.</AlertDescription>
                               </Alert>
                               <Button variant="outline" onClick={handleLogout} className="w-full">
                                   <LogOut className="mr-2 h-4 w-4" /> Logout
                               </Button>
                           </CardContent>
                       </Card>
                   ) : (
                       <AdminLoginPage />
                   )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground text-center flex-grow">
                    Sales Analytics
                </h1>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </header>
            <AdminAnalyticsPage />
        </div>
    );
}
