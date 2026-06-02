import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface SlantedPanelProps {
    children: ReactNode;
    className?: string;
    variant?: 'blue' | 'black';
}

export function SlantedPanel({ children, className, variant = 'blue' }: SlantedPanelProps) {
    return (
        <div className={cn("relative w-full h-full p-[2px]", className)}>
            <div className={cn(
                "w-full h-full transform skew-x-[-3deg] absolute inset-0 z-0",
                variant === 'blue' ? "bg-accent-blue shadow-[0_0_30px_rgba(43,140,238,0.3)]" : "bg-card border border-border-default/50 hover:border-border-hover transition-colors"
            )} />
            <div className="relative z-10 w-full h-full transform overflow-hidden p-6 md:p-8">
                {children}
            </div>
        </div>
    );
}
 
