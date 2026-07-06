import { cn } from "@/lib/utils";

interface PulseIndicatorProps {
    status: "active" | "inactive" | "warning" | "error";
    className?: string;
}

export function PulseIndicator({ status, className }: PulseIndicatorProps) {
    const colors = {
        active: "bg-emerald-400 shadow-emerald-400/50",
        inactive: "bg-slate-500 shadow-slate-500/50",
        warning: "bg-amber-400 shadow-amber-400/50",
        error: "bg-red-400 shadow-red-400/50",
    };

    return (
        <div className={cn("relative flex h-3 w-3", className)}>
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])}></span>
            <span className={cn("relative inline-flex rounded-full h-3 w-3", colors[status])}></span>
        </div>
    );
}
