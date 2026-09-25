"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useSupabase } from "@/lib/supabase/provider";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Loader2, Calendar, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { CustomerFeedback } from "@/lib/types";

export default function MyFeedbackPage() {
    const { user, supabase, isUserLoading } = useSupabase();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && (!user || user.is_anonymous)) {
            router.replace("/login");
        }
    }, [isUserLoading, user, router]);

    const { data: feedbacks = [], isLoading: isFeedbackLoading } = useSWR(
        user && !user.is_anonymous ? (["my-feedback", user.id] as const) : null,
        async ([, userId]) => {
            const { data, error } = await supabase
                .from("customer_feedbacks")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as CustomerFeedback[];
        }
    );
    const isLoading = !user || isFeedbackLoading;

    if (isUserLoading || isLoading) {
        return (
            <div className="flex flex-col h-full min-h-screen bg-background px-4 sm:px-0 max-w-md mx-auto items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Clean Header */}
            <div className="sticky top-0 bg-background z-10 px-4 py-4 sm:px-6">
                <div className="max-w-md mx-auto flex items-center justify-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="absolute left-0 rounded-full hover:bg-foreground/5"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Feedback</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 sm:px-6 pt-6">
                {/* Create new feedback */}
                <Button
                    onClick={() => router.push("/feedback")}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-2xl shadow-md shadow-primary/20 transition-all active:scale-[0.98] mb-6"
                >
                    <MessageSquarePlus className="mr-2 h-5 w-5" />
                    Write New Feedback
                </Button>

                {feedbacks.length === 0 ? (
                    <div className="text-center mt-12 flex flex-col items-center">
                        <div className="bg-card shadow-sm w-16 h-16 rounded-full flex items-center justify-center mb-6 border">
                            <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2 text-foreground">No feedback yet</h2>
                        <p className="text-sm text-muted-foreground/80 max-w-[250px]">
                            Tap “Write New Feedback” above to share your thoughts with us.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((fb) => (
                            <div
                                key={fb.id}
                                className="bg-card rounded-2xl p-5 shadow-[0_2px_8px_rgb(0,0,0,0.04)] border"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                        {format(new Date(fb.created_at), "MMM dd, yyyy")}
                                    </div>
                                    {fb.order_id && (
                                        <div className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                                            Order {fb.order_id.substring(0, 8)}
                                        </div>
                                    )}
                                </div>
                                <p className="text-foreground text-[15px] font-medium leading-relaxed">
                                    "{fb.body}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
