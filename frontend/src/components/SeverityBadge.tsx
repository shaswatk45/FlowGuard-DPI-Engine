import { cn } from '../utils/cn';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

interface SeverityBadgeProps {
    severity: Severity;
    className?: string;
}

const CONFIG: Record<Severity, { label: string; bg: string; text: string }> = {
    critical: { label: 'CRITICAL', bg: 'bg-signal-block', text: 'text-white' },
    high:     { label: 'HIGH',     bg: 'bg-[#ff6be3]', text: 'text-black' },
    medium:   { label: 'MEDIUM',   bg: 'bg-signal-warn', text: 'text-black' },
    low:      { label: 'LOW',      bg: 'bg-signal-allow', text: 'text-black' },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
    const cfg = CONFIG[severity] ?? CONFIG.medium;
    return (
        <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]',
            cfg.bg, cfg.text, className
        )}>
            {cfg.label}
        </span>
    );
}

export function getThreatLevel(dropped: number, totalPackets: number): Severity {
    if (totalPackets === 0) return 'low';
    const rate = dropped / totalPackets;
    if (rate >= 0.25 || dropped >= 100) return 'critical';
    if (rate >= 0.1 || dropped >= 20) return 'high';
    if (rate >= 0.02 || dropped >= 5) return 'medium';
    return 'low';
}
