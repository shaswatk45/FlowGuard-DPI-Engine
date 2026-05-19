import { cn } from '../utils/cn';

export type ThreadType = 'lb' | 'fp';

interface ThreadBarProps {
    id: string;
    type: ThreadType;
    load: number; // 0 to 100
    className?: string;
}

export function ThreadBar({ id, type, load, className }: ThreadBarProps) {
    // LB threads cyan
    // FP threads green → amber → red based on load
    let barColorClass = '';

    if (type === 'lb') {
        barColorClass = 'bg-signal-info'; // Cyan
    } else {
        if (load < 50) barColorClass = 'bg-signal-allow'; // Green
        else if (load < 80) barColorClass = 'bg-signal-warn'; // Amber
        else barColorClass = 'bg-signal-block'; // Red
    }

    return (
        <div className={cn("flex flex-col space-y-2", className)}>
            <div className="flex justify-between items-center text-identifier-label">
                <span className="text-white/80">{type === 'lb' ? 'LB' : 'FP'} {id}</span>
                <span className="font-mono text-white/50">{load.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                    className={cn("h-full rounded-full transition-all duration-300 ease-in-out", barColorClass)}
                    style={{ width: `${Math.max(0, Math.min(100, load))}%` }}
                />
            </div>
        </div>
    );
}
