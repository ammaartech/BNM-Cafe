import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function TooltipExplainer({ content }: { content: React.ReactNode }) {
    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-1.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors inline-block align-top" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px] text-center text-sm p-3 shadow-xl backdrop-blur-md bg-background/95 border focus-visible:outline-none focus:outline-none z-50">
                    <div className="font-mono text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Insight</div>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
