import { cn } from '../utils/cn';

interface LogEntry {
    id: string;
    time: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
}

interface ProgressLogProps {
    logs: LogEntry[];
    progress: number; // 0 to 100
    className?: string;
}

export function ProgressLog({ logs, progress, className }: ProgressLogProps) {
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'info': return 'text-signal-info';
            case 'warn': return 'text-signal-warn';
            case 'error': return 'text-signal-block';
            case 'success': return 'text-signal-allow';
            default: return 'text-white/70';
        }
    };

    return (
        <div className={cn("flex flex-col w-full bg-[#0A0C0E] border border-border-default rounded-card overflow-hidden", className)}>
            {/* Progress Bar (4px height) */}
            <div className="w-full h-[4px] bg-[#161A1E]">
                <div
                    className="h-full bg-gradient-cta transition-all duration-300 ease-in-out"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-table-data max-h-[300px] flex flex-col space-y-1">
                {logs.length === 0 ? (
                    <div className="text-white/30 italic">Waiting for engine output...</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex hover:bg-white/[0.02] px-2 py-1 rounded transition-colors break-words">
                            <span className="text-white/40 mr-4 opacity-70 shrink-0">[{log.time}]</span>
                            <span className={cn("mr-3 shrink-0 uppercase tracking-wide", getLevelColor(log.level))}>
                                {log.level.padEnd(7)}
                            </span>
                            <span className="text-white/80">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
