import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}

export function PillButton({ className, variant = 'primary', children, ...props }: PillButtonProps) {
    return (
        <button
            className={cn(
                'relative inline-flex items-center justify-center px-8 py-3 rounded-full font-sans text-body font-bold tracking-widest',
                'transition-all duration-200 ease-in-out uppercase',
                'hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed',
                variant === 'primary' && 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]',
                variant === 'secondary' && 'bg-black text-white border border-white/20 hover:border-white/50 shadow-sm',
                variant === 'danger' && 'bg-signal-block text-black shadow-[0_0_20px_rgba(255,77,79,0.3)] hover:shadow-[0_0_30px_rgba(255,77,79,0.5)]',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
