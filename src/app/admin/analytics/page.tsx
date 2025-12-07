
"use client";

import { useSupabase } from "@/lib/supabase/provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, IndianRupee, ShoppingCart, Users, AlertCircle, Download, TrendingUp, TrendingDown, Package } from "lucide-react";
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
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfDay } from 'date-fns';
import { ChartTooltipContent } from "@/components/ui/chart";


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
            const totalRevenue = ordersData.reduce((acc, order) => acc + order.total_amount, 0);
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
                    revenue: dayOrders.reduce((sum, order) => sum + order.total_amount, 0),
                    sales: dayOrders.length
                };
            });
            
            // 3. Aggregate Top Products
            const productSales = new Map<string, { name: string; unitsSold: number; revenue: number; id: string }>();
            ordersData.forEach(order => {
                order.order_items.forEach((item: any) => {
                    const existing = productSales.get(item.menu_item_id);
                    if (existing) {
                        existing.unitsSold += item.quantity;
                        existing.revenue += item.price * item.quantity;
                    } else {
                        productSales.set(item.menu_item_id, {
                            id: item.menu_item_id,
                            name: item.name,
                            unitsSold: item.quantity,
                            revenue: item.price * item.quantity,
                        });
                    }
                });
            });

            const topProducts = Array.from(productSales.values())
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .map(p => ({ ...p, price: p.revenue / p.unitsSold, quantity: p.unitsSold }));


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
        const rows = data.topProducts.map(p => [p.id, `"${p.name}"`, p.unitsSold, p.revenue.toFixed(2)]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\\n");
            
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "top-products-analytics.csv");
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
                        <div className="text-2xl font-bold">₹{data.totalRevenue.toFixed(2)}</div>
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
                         <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={data.salesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="sales" stroke="hsl(var(--accent))" />
                            </LineChart>
                         </ResponsiveContainer>
                    </CardContent>
                </Card>

                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Selling Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={350}>
                            <RechartsBarChart data={data.topProducts.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                                <Legend />
                                <Bar dataKey="unitsSold" fill="hsl(var(--primary))" name="Units Sold" radius={[0, 4, 4, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
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
                                    <TableCell className="text-right">₹{product.revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}

export default function AnalyticsPageContainer() {
    const { user, userRole, isUserLoading } = useSupabase();

    if (isUserLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!user || userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You must be an administrator to view this page.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
                    Sales Analytics
                </h1>
            </header>
            <AdminAnalyticsPage />
        </div>
    );
}
