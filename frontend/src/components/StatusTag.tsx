import { cn } from '../utils/cn';

export type SignalColor = 'allow' | 'block' | 'warn' | 'info' | 'purple' | 'disabled';

interface StatusTagProps {
    status: string;
    signal: SignalColor;
    className?: string;
}

export function StatusTag({ status, signal, className }: StatusTagProps) {
    const bgColors = {
        allow: 'bg-signal-allow',
        block: 'bg-signal-block',
        warn: 'bg-signal-warn',
        info: 'bg-signal-info',
        purple: 'bg-signal-purple',
        disabled: 'bg-signal-disabled',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-status-tag font-bold font-sans uppercase tracking-[0.1em] text-black',
                bgColors[signal],
                className
            )}
        >
            {status}
        </span>
    );
}
 
