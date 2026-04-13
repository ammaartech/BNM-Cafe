import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
    value: number;
    label?: string;
    className?: string;
    isCurrency?: boolean;
}

export function TrendIndicator({ value, label, className, isCurrency }: TrendIndicatorProps) {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const isNeutral = value === 0;

    return (
        <div className={cn("flex flex-wrap items-center gap-1 text-sm font-medium mt-1 animate-in slide-in-from-bottom border w-fit px-2 py-0.5 rounded-full shadow-sm transition-all hover:shadow duration-300", {
            "text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20": isPositive,
            "text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20": isNegative,
            "text-muted-foreground border-border bg-muted/20": isNeutral,
        }, className)}>
            <span className="flex items-center">
                {isPositive && <ArrowUp className="w-3.5 h-3.5 mr-0.5" />}
                {isNegative && <ArrowDown className="w-3.5 h-3.5 mr-0.5" />}
                {isNeutral && <Minus className="w-3.5 h-3.5 mr-0.5" />}
                <span>
                    {Math.abs(value).toFixed(1)}
                    {isCurrency ? "" : "%"}
                </span>
            </span>
            {label && <span className="text-muted-foreground ml-1 text-xs font-medium opacity-80">{label}</span>}
        </div>
    );
}
