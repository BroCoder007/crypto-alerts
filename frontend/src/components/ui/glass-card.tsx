import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div className={cn("glass rounded-xl p-6 shadow-xl", className)}>
            {children}
        </div>
    );
}
