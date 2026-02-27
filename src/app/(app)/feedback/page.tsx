"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Send } from "lucide-react";

const formSchema = z.object({
    name: z.string().optional(),
    phone: z.string().min(10, { message: "Please enter a valid phone number" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    body: z.string().min(5, { message: "Feedback must be at least 5 characters long" }),
});

export default function FeedbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const { user, supabase } = useSupabase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: user?.email || "",
            body: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "You must be signed in to submit feedback.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        const { error } = await supabase.from("customer_feedbacks").insert({
            user_id: user.id,
            order_id: orderId || null,
            name: values.name || null,
            phone: values.phone,
            email: values.email,
            body: values.body,
        });

        setIsSubmitting(false);

        if (error) {
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your feedback. Please try again.",
                variant: "destructive",
            });
            console.error("Feedback error:", error);
        } else {
            toast({
                title: "Thank you!",
                description: "Your feedback has been successfully submitted.",
                className: "bg-[#154b23] text-white border-[#154b23]",
            });
            if (orderId) {
                router.push(`/orders/${orderId}`);
            } else {
                router.push("/profile");
            }
        }
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-slate-50/80 backdrop-blur-xl z-10 px-4 py-4 sm:px-6 shadow-sm border-b border-muted">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 rounded-full hover:bg-slate-200/50">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Write a Review</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 sm:px-6 pt-8">
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    <motion.div variants={itemVariants} className="mb-8">
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
                            We'd love to hear from you.
                        </h2>
                        <p className="text-muted-foreground text-base">
                            Your thoughts help us improve our service and make your next experience even better.
                            {orderId && <span className="block mt-1 font-medium text-[#154b23]">Re: Order {orderId.substring(0, 8).toUpperCase()}</span>}
                        </p>
                    </motion.div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <motion.div variants={itemVariants} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground">Name <span className="text-xs font-normal opacity-70">(Optional)</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Your Name"
                                                    className="h-14 px-4 bg-white border-muted/60 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-[#154b23] focus-visible:border-[#154b23] transition-all text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground">Phone Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="+91 98765 43210"
                                                    className="h-14 px-4 bg-white border-muted/60 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-[#154b23] focus-visible:border-[#154b23] transition-all text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground">Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="you@example.com"
                                                    type="email"
                                                    className="h-14 px-4 bg-white border-muted/60 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-[#154b23] focus-visible:border-[#154b23] transition-all text-base"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="pt-2"> {/* Visual separation for the message body */}
                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-muted-foreground">Your Feedback</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Tell us what you loved or what we can improve..."
                                                        className="resize-none min-h-[160px] p-4 bg-white border-muted/60 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-[#154b23] focus-visible:border-[#154b23] transition-all text-base"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="pt-4 pb-8">
                                <Button
                                    type="submit"
                                    className="w-full bg-[#154b23] hover:bg-[#0e3318] text-white font-bold h-14 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                    disabled={isSubmitting}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {isSubmitting ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center"
                                            >
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Sending...
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="submit"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center"
                                            >
                                                <Send className="mr-2 h-5 w-5" />
                                                Submit Review
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </motion.div>

                        </form>
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}
