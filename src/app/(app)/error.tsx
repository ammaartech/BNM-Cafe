"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary for customer-facing routes. Renders inside the app layout,
// so the bottom navigation stays available.
export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App route error:", error);
    }, [error]);

    return (
        <div className="flex flex-col flex-grow items-center justify-center px-6 py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
                Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-xs mb-8">
                We couldn&apos;t load this page. Check your connection and give it
                another try.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={reset} className="h-12 rounded-xl font-bold">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl font-bold">
                    <Link href="/menu">Back to Menu</Link>
                </Button>
            </div>
            {error.digest && (
                <p className="text-xs text-muted-foreground/60 mt-8">
                    Error code: {error.digest}
                </p>
            )}
        </div>
    );
}
