"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { format } from "date-fns";
import { Download, Loader2, MessageSquare, Search } from "lucide-react";
import type { CustomerFeedback } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminFeedbackDashboard() {
    const { supabase } = useSupabase();
    const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function loadFeedbacks() {
            const { data, error } = await supabase
                .from("customer_feedbacks")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setFeedbacks(data as CustomerFeedback[]);
            }
            setIsLoading(false);
        }
        loadFeedbacks();
    }, [supabase]);

    const filteredFeedbacks = feedbacks.filter((fb) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            (fb.name && fb.name.toLowerCase().includes(searchLower)) ||
            fb.email.toLowerCase().includes(searchLower) ||
            fb.phone.includes(searchLower) ||
            (fb.order_id && fb.order_id.toLowerCase().includes(searchLower)) ||
            fb.body.toLowerCase().includes(searchLower)
        );
    });

    const downloadCSV = () => {
        if (filteredFeedbacks.length === 0) return;

        const headers = ["Date", "Name", "Email", "Phone", "Order ID", "Feedback"];
        const csvContent = [
            headers.join(","),
            ...filteredFeedbacks.map((fb) => {
                return [
                    `"${format(new Date(fb.created_at), "yyyy-MM-dd HH:mm")}"`,
                    `"${fb.name || "N/A"}"`,
                    `"${fb.email}"`,
                    `"${fb.phone}"`,
                    `"${fb.order_id || "N/A"}"`,
                    `"${fb.body.replace(/"/g, '""')}"`, // Escape quotes in body
                ].join(",");
            }),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bnm_feedback_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1e] flex items-center">
                        <MessageSquare className="h-8 w-8 mr-3 text-[#154b23]" />
                        Customer Feedback
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and manage feedback submitted by your customers.</p>
                </div>
                <Button onClick={downloadCSV} className="bg-[#154b23] hover:bg-[#0e3318]" disabled={filteredFeedbacks.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card className="shadow-sm border-muted">
                <CardHeader className="pb-4 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>All Responses</CardTitle>
                            <CardDescription>You have {filteredFeedbacks.length} feedback entries.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search feedback..."
                                className="pl-9 bg-muted/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No feedback found</p>
                            <p className="text-sm">Try adjusting your search criteria or wait for new submissions.</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Date</TableHead>
                                        <TableHead className="w-[200px]">Customer</TableHead>
                                        <TableHead className="w-[120px]">Order ID</TableHead>
                                        <TableHead>Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFeedbacks.map((fb) => (
                                        <TableRow key={fb.id}>
                                            <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                                                {format(new Date(fb.created_at), "MMM dd, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold">{fb.name || "Anonymous"}</div>
                                                <div className="text-xs text-muted-foreground">{fb.email}</div>
                                                <div className="text-xs text-muted-foreground">{fb.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                {fb.order_id ? (
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                        {fb.order_id.substring(0, 8)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="line-clamp-3 text-sm" title={fb.body}>
                                                    {fb.body}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
