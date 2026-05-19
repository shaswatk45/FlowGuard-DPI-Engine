import { MoreVertical } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { cn } from '../utils/cn';

export interface NexusRule {
    id: string;
    title: string;
    description: string;
    tags: string[];
    enabled: boolean;
}

interface RuleCardProps {
    rule: NexusRule;
    onToggle: (id: string, enabled: boolean) => void;
    className?: string;
}

export function RuleCard({ rule, onToggle, className }: RuleCardProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between bg-[#111111] rounded-[24px] border border-white/5 p-8 transition-colors hover:border-white/10", className)}>
            <div className="flex flex-col max-w-xl">
                {/* Tags */}
                <div className="flex items-center space-x-3 mb-6">
                    {rule.tags.map((tag, i) => {
                        let bgColor = "bg-white";
                        let textColor = "text-black";

                        if (tag.includes('SECURITY')) bgColor = "bg-[#ff6be3]"; // Hot Pink
                        else if (tag.includes('BANDWIDTH')) { bgColor = "bg-[#3381ff]"; textColor = "text-white"; } // Bright Blue
                        else if (tag.includes('QOS')) bgColor = "bg-[#ffad0f]"; // Vivid Orange
                        else if (tag.includes('COMPLIANCE')) bgColor = "bg-[#00f298]"; // Neon Green
                        else if (tag.includes('TOR-BLOCK') || tag.includes('BRUTE-FORCE')) { bgColor = "bg-white"; textColor = "text-black"; }

                        return (
                            <span key={i} className={cn(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[16px]",
                                bgColor,
                                textColor
                            )}>
                                {tag}
                            </span>
                        );
                    })}
                </div>

                {/* Content */}
                <h3 className="text-2xl text-white font-black tracking-tighter uppercase mb-2">{rule.title}</h3>
                <p className="text-[#A0A4A8] text-[15px] font-medium leading-relaxed">
                    {rule.description}
                </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-6 mt-6 md:mt-0">
                <div className="flex flex-col items-center space-y-2">
                    <span className="text-[10px] text-white/30 font-black tracking-[0.2em] uppercase">State</span>
                    <ToggleSwitch
                        checked={rule.enabled}
                        onChange={(checked) => onToggle(rule.id, checked)}
                    />
                </div>
                <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-5 h-5 text-white/50" />
                </button>
            </div>
        </div>
    );
}
