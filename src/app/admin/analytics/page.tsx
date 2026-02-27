"use client";

import { useSupabase } from "@/lib/supabase/provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    IndianRupee, ShoppingCart, Users, AlertCircle, Download,
    TrendingUp, TrendingDown, Package, LogIn, LogOut, Loader2, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import type { OrderItem } from "@/lib/types";
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
    LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line,
    Bar, BarChart as RechartsBarChart, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, isToday, isYesterday } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all';

interface RawOrder {
    id: string;
    display_order_id: string;
    order_date: string;
    total_amount: number;
    status: string;
    payment_status: string;
    payment_method: string | null;
    user_id: string;
    user_name: string;
    order_items: (OrderItem & { menu_items?: { station_id?: string; category?: string } })[];
}

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    aov: number; // Avg Order Value
    salesOverTime: { date: string; revenue: number; sales: number }[];
    topProducts: (OrderItem & { revenue: number, unitsSold: number })[];
    paymentDistribution: { name: string; value: number }[];
    uniqueCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    categorySales: { name: string; value: number }[];
    peakHours: { hour: string; orders: number }[];
    recentOrders: RawOrder[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#3b82f6'];

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex gap-2 mb-6 overlow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="shadow-sm">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

const salesChartConfig = {
    revenue: { label: "Revenue (₹)", color: "hsl(var(--primary))" },
    sales: { label: "Orders", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

function AdminAnalyticsPage() {
    const { supabase } = useSupabase();
    const [allOrders, setAllOrders] = useState<RawOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('today');

    // 1. Fetch ALL data once
    useEffect(() => {
        const fetchAllData = async () => {
            if (!supabase) return;
            setIsLoading(true);

            // Fetching all non-cancelled orders
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*, order_items(*, menu_items(station_id, category))")
                .neq('status', 'CANCELLED')
                .order('order_date', { ascending: false });

            if (ordersError) {
                setError("Failed to fetch order data.");
                setIsLoading(false);
                return;
            }

            setAllOrders(ordersData as RawOrder[]);
            setIsLoading(false);
        };
        fetchAllData();
    }, [supabase]);

    // 2. Compute Filtered Data based on timeRange
    const dashboardData = useMemo<AnalyticsData | null>(() => {
        if (!allOrders.length) return null;

        const now = new Date();
        let startDate: Date;
        let endDate: Date = endOfDay(now);

        switch (timeRange) {
            case 'today':
                startDate = startOfDay(now);
                break;
            case 'yesterday':
                startDate = startOfDay(subDays(now, 1));
                endDate = endOfDay(subDays(now, 1));
                break;
            case '7days':
                startDate = startOfDay(subDays(now, 6)); // Includes today = 7 days
                break;
            case '30days':
                startDate = startOfDay(subDays(now, 29));
                break;
            case 'all':
            default:
                startDate = new Date(0); // Epoch
                break;
        }

        // Filter valid orders within range
        const filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.order_date);
            return isWithinInterval(orderDate, { start: startDate, end: endDate });
        });

        // KPI Calculation
        const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
        const totalOrders = filteredOrders.length;
        const totalCustomers = new Set(filteredOrders.map(o => o.user_id)).size;
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        let totalItemsSold = 0;

        // Top Products Aggregation
        const productSales = new Map<string, { name: string; unitsSold: number; revenue: number; id: string }>();
        filteredOrders.forEach(order => {
            (order.order_items || []).forEach(item => {
                // IMPORTANT: use menu_item_uuid, menu_item_id, or simply name as fallback
                const aggregationKey = (item as any).menu_item_uuid || item.menu_item_id || item.name;
                const existing = productSales.get(aggregationKey);
                const itemRevenue = (item.price || 0) * (item.quantity || 0);
                const itemQuantity = item.quantity || 0;

                totalItemsSold += itemQuantity;
                if (itemQuantity === 0) return;

                if (existing) {
                    existing.unitsSold += itemQuantity;
                    existing.revenue += itemRevenue;
                } else {
                    productSales.set(aggregationKey, {
                        id: aggregationKey,
                        name: item.name,
                        unitsSold: itemQuantity,
                        revenue: itemRevenue,
                    });
                }
            });
        });

        const topProducts = Array.from(productSales.values())
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .map(p => ({ ...p, price: p.unitsSold > 0 ? p.revenue / p.unitsSold : 0, quantity: p.unitsSold, uuid: p.id }));

        // Time Series Chart Aggregation
        let chartIntervals: string[] = [];
        let dateFormat = 'MMM dd';

        if (timeRange === 'today' || timeRange === 'yesterday') {
            // Group by hour
            chartIntervals = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
            dateFormat = 'HH:mm';
        } else if (timeRange === 'all') {
            // Group by month
            const uniqueMonths = new Set(filteredOrders.map(o => format(new Date(o.order_date), 'MMM yyyy')));
            chartIntervals = Array.from(uniqueMonths).reverse();
            dateFormat = 'MMM yyyy';
        } else {
            // Group by day
            const daysCount = timeRange === '7days' ? 7 : 30;
            chartIntervals = Array.from({ length: daysCount }, (_, i) => {
                return format(subDays(endDate, i), 'yyyy-MM-dd');
            }).reverse();
            dateFormat = 'yyyy-MM-dd'; // Internal check key
        }

        const salesOverTime = chartIntervals.map(intervalKey => {
            const periodOrders = filteredOrders.filter(o => {
                const d = new Date(o.order_date);
                if (timeRange === 'today' || timeRange === 'yesterday') return format(d, 'HH:00') === intervalKey;
                if (timeRange === 'all') return format(d, 'MMM yyyy') === intervalKey;
                return format(d, 'yyyy-MM-dd') === intervalKey;
            });

            return {
                date: (timeRange === '7days' || timeRange === '30days') ? format(new Date(intervalKey), 'MMM dd') : intervalKey,
                revenue: periodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
                sales: periodOrders.length
            };
        });

        // Payment Distribution
        const razorpayCount = filteredOrders.filter(o => o.payment_method?.toUpperCase() === 'RAZORPAY').length;
        const upiCount = filteredOrders.filter(o => o.payment_method?.toUpperCase() === 'UPI').length;
        const cashCount = filteredOrders.filter(o => o.payment_method?.toUpperCase() === 'CASH').length;
        const unknownCount = filteredOrders.filter(o => !['RAZORPAY', 'UPI', 'CASH'].includes(o.payment_method?.toUpperCase() || '')).length;

        const paymentDist = [
            { name: 'Razorpay', value: razorpayCount },
            { name: 'UPI (Counter)', value: upiCount },
            { name: 'Cash', value: cashCount },
            { name: 'Unknown/Legacy', value: unknownCount }
        ].filter(d => d.value > 0);

        // Customer insights
        const userFirstOrderDate = new Map<string, Date>();
        allOrders.forEach(o => {
            if (!o.user_id) return;
            const d = new Date(o.order_date);
            if (!userFirstOrderDate.has(o.user_id) || d < userFirstOrderDate.get(o.user_id)!) {
                userFirstOrderDate.set(o.user_id, d);
            }
        });

        let newCustomers = 0;
        let returningCustomers = 0;
        const uniqueUsersInPeriod = new Set(filteredOrders.filter(o => o.user_id).map(o => o.user_id));
        uniqueUsersInPeriod.forEach(userId => {
            const firstDate = userFirstOrderDate.get(userId);
            if (firstDate && firstDate >= startDate) newCustomers++;
            else returningCustomers++;
        });

        // Category breakdown
        const categoryCount = new Map<string, number>();
        filteredOrders.forEach(order => {
            (order.order_items || []).forEach(item => {
                const cat = (item as any).menu_items?.category || 'uncategorized';
                categoryCount.set(cat, (categoryCount.get(cat) || 0) + (item.quantity || 0));
            });
        });
        const categorySales = Array.from(categoryCount.entries())
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '), value }))
            .sort((a, b) => b.value - a.value);

        // Peak Hours
        const hourlyCount = new Map<string, number>();
        filteredOrders.forEach(order => {
            const hour = format(new Date(order.order_date), 'HH:00');
            hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
        });
        const peakHours = Array.from(hourlyCount.entries())
            .map(([hour, orders]) => ({ hour, orders }))
            .sort((a, b) => a.hour.localeCompare(b.hour));

        return {
            totalRevenue,
            totalOrders,
            totalItemsSold,
            aov,
            salesOverTime,
            topProducts,
            paymentDistribution: paymentDist,
            uniqueCustomers: uniqueUsersInPeriod.size,
            newCustomers,
            returningCustomers,
            categorySales,
            peakHours,
            recentOrders: filteredOrders.slice(0, 10) // Last 10
        };

    }, [allOrders, timeRange]);


    const downloadCSV = () => {
        if (!dashboardData?.topProducts) return;
        const headers = ["Product ID", "Product Name", "Units Sold", "Total Revenue (INR)"];
        const rows = dashboardData.topProducts.map(p => [p.id, `"${p.name.replace(/"/g, '""')}"`, p.unitsSold, (p.revenue || 0).toFixed(2)]);
        let csvContent = headers.join(",") + "\r\n" + rows.map(r => r.join(",")).join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `bnm_report_${timeRange}.csv`;
        link.click();
    }

    if (isLoading) return <AnalyticsSkeleton />;
    if (error) return (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Context Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
                <Button variant={timeRange === 'today' ? 'default' : 'outline'} className="rounded-full" onClick={() => setTimeRange('today')}>Today</Button>
                <Button variant={timeRange === 'yesterday' ? 'default' : 'outline'} className="rounded-full" onClick={() => setTimeRange('yesterday')}>Yesterday</Button>
                <Button variant={timeRange === '7days' ? 'default' : 'outline'} className="rounded-full" onClick={() => setTimeRange('7days')}>Last 7 Days</Button>
                <Button variant={timeRange === '30days' ? 'default' : 'outline'} className="rounded-full" onClick={() => setTimeRange('30days')}>Last 30 Days</Button>
                <Button variant={timeRange === 'all' ? 'default' : 'outline'} className="rounded-full" onClick={() => setTimeRange('all')}>All Time</Button>
            </div>

            {!dashboardData ? (
                <Alert><Package className="h-4 w-4" /><AlertTitle>No Data</AlertTitle><AlertDescription>There are no sales for the selected period.</AlertDescription></Alert>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-sm border-l-4 border-l-primary/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">₹{dashboardData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-accent/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Order Volume</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{dashboardData.totalOrders.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">₹{dashboardData.aov.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{dashboardData.totalItemsSold.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Charts */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4 shadow-sm">
                            <CardHeader>
                                <CardTitle>Revenue & Order Trend</CardTitle>
                                <CardDescription>Performance metrics across the selected time period.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-0 pb-0">
                                <ChartContainer config={salesChartConfig} className="min-h-[350px] w-full">
                                    <LineChart accessibilityLayer data={dashboardData.salesOverTime} margin={{ right: 20, left: 10 }}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${value}`} width={60} />
                                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} width={40} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} yAxisId="left" />
                                        <Line dataKey="sales" type="monotone" stroke="var(--color-sales)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} yAxisId="right" />
                                    </LineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3 shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Payment Methods</CardTitle>
                                <CardDescription>Breakdown by collection type</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                                {dashboardData.paymentDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={dashboardData.paymentDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {dashboardData.paymentDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No payment data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Advanced Demographics & Insights */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Customer Retention</CardTitle>
                                <CardDescription>New vs Returning Customers</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                                {dashboardData.newCustomers > 0 || dashboardData.returningCustomers > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'New Customers', value: dashboardData.newCustomers },
                                                    { name: 'Returning', value: dashboardData.returningCustomers }
                                                ]}
                                                cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
                                            >
                                                <Cell fill="hsl(var(--primary))" />
                                                <Cell fill="hsl(var(--accent))" />
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} Users`, name]} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Category Trends</CardTitle>
                                <CardDescription>Popularity by category (Volume)</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                                {dashboardData.categorySales.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={dashboardData.categorySales}
                                                cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
                                            >
                                                {dashboardData.categorySales.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} items`, name]} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Peak Business Hours</CardTitle>
                                <CardDescription>Orders placed by time of day</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                                {dashboardData.peakHours.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={dashboardData.peakHours} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Data Tables */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Top Selling Items</CardTitle>
                                    <CardDescription>Highest volume products</CardDescription>
                                </div>
                                <Button onClick={downloadCSV} variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" /> Export
                                </Button>
                            </CardHeader>
                            <CardContent className="px-0 sm:px-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboardData.topProducts.slice(0, 8).map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-right">{product.unitsSold}</TableCell>
                                                <TableCell className="text-right font-semibold">₹{(product.revenue || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Latest {dashboardData.recentOrders.length} orders in this period</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 sm:px-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Order</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboardData.recentOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    #{order.display_order_id}
                                                    <div className="text-xs text-muted-foreground hidden sm:block">{order.user_name}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(order.order_date), 'MMM dd, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={order.payment_status === 'PAID' ? 'text-green-600 border-green-200' : 'text-orange-600 border-orange-200'}>
                                                        {order.payment_status === 'PAID' ? 'Online' : 'Counter'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">₹{(order.total_amount).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

// ... Authentication wrappers remain mostly unchanged below ...

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
        if (error) setError(error.message);
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center h-full w-full">
            <Card className="w-full max-w-sm border-0 shadow-xl ring-1 ring-border/50">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center">Sign in to view dashboard metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 bg-muted/20" />
                        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 bg-muted/20" />
                        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full h-12 text-md" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                            {isLoading ? 'Authenticating...' : 'View Dashboard'}
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
        if (supabase) await supabase.auth.signOut();
        router.push('/');
    };

    if (isUserLoading) {
        return <div className="p-8 bg-background min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const isUserAdmin = user && !user.is_anonymous && userProfile?.role === 'admin';

    if (!isUserAdmin) {
        const isUserLoggedInButNotAdmin = user && !user.is_anonymous && userProfile?.role !== 'admin';
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-background/50 min-h-screen flex flex-col justify-center items-center">
                {isUserLoggedInButNotAdmin ? (
                    <Card className="w-full max-w-sm shadow-xl">
                        <CardHeader><CardTitle className="text-2xl text-center">Access Denied</CardTitle></CardHeader>
                        <CardContent className="text-center">
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Permission Error</AlertTitle>
                                <AlertDescription>You do not have permission to access the analytics dashboard.</AlertDescription>
                            </Alert>
                            <Button variant="outline" onClick={handleLogout} className="w-full h-12"><LogOut className="mr-2 h-5 w-5" /> Logout</Button>
                        </CardContent>
                    </Card>
                ) : <AdminLoginPage />}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-background/50 min-h-screen flex flex-col">
            <header className="mb-8 flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="h-6 w-6 text-primary" /></div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">Real-time point of sale metrics</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleLogout} className="rounded-full px-6">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </header>
            <main>
                <AdminAnalyticsPage />
            </main>
        </div>
    );
}
