import { Trash2 } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '../utils/cn';

export interface FlowGuardRule {
    id: string;
    title: string;
    description: string;
    tags: string[];
    enabled: boolean;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    flag?: string;
    hits?: number;
}

interface RuleCardProps {
    rule: FlowGuardRule;
    onToggle: (id: string, enabled: boolean) => void;
    onDelete?: (id: string) => void;
    className?: string;
}

export function RuleCard({ rule, onToggle, onDelete, className }: RuleCardProps) {
    return (
        <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between bg-card rounded-[24px] border border-border-default p-8 transition-all hover:border-border-hover group",
            rule.enabled && "border-accent-blue/20 hover:border-accent-blue/40",
            className
        )}>
            <div className="flex flex-col max-w-xl">
                <div className="flex items-center flex-wrap gap-3 mb-6">
                    {rule.severity && <SeverityBadge severity={rule.severity} />}
                    {rule.tags.map((tag, i) => {
                        let bgColor = "bg-white";
                        let textColor = "text-black";

                        if (tag.includes('SECURITY'))   bgColor = "bg-[#ff6be3]";
                        else if (tag.includes('BANDWIDTH'))  { bgColor = "bg-[#3381ff]"; textColor = "text-white"; }
                        else if (tag.includes('QOS'))        bgColor = "bg-[#ffad0f]";
                        else if (tag.includes('COMPLIANCE')) bgColor = "bg-[#00f298]";
                        else if (tag.includes('CUSTOM'))     { bgColor = "bg-[#a78bfa]"; textColor = "text-white"; }

                        return (
                            <span key={i} className={cn(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[16px]",
                                bgColor, textColor
                            )}>
                                {tag}
                            </span>
                        );
                    })}

                    {/* Hit counter badge */}
                    {typeof rule.hits === 'number' && rule.hits > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest"
                            style={{ background: 'rgba(255,77,79,0.15)', color: '#ff4d4f', boxShadow: '0 0 12px rgba(255,77,79,0.2)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4f] animate-pulse" />
                            {rule.hits.toLocaleString()} blocked
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-black tracking-tighter uppercase mb-2" style={{ color: 'var(--text-primary)' }}>
                    {rule.title}
                </h3>
                <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {rule.description}
                </p>
                {rule.flag && (
                    <code className="mt-3 text-[10px] font-mono text-white/30 bg-white/[0.04] rounded-lg px-3 py-1.5 self-start">
                        {rule.flag}
                    </code>
                )}
            </div>

            <div className="flex items-center space-x-4 mt-6 md:mt-0 shrink-0">
                <div className="flex flex-col items-center space-y-2">
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">State</span>
                    <ToggleSwitch
                        checked={rule.enabled}
                        onChange={(checked) => onToggle(rule.id, checked)}
                    />
                </div>
                {onDelete && (
                    <button
                        onClick={() => onDelete(rule.id)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-signal-block/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete rule"
                    >
                        <Trash2 className="w-4 h-4 text-signal-block/60 hover:text-signal-block transition-colors" />
                    </button>
                )}
            </div>
        </div>
    );
}
