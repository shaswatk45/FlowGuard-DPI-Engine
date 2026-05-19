import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { cn } from '../utils/cn';
import type { SignalColor } from './StatusTag';

interface MetricCardProps {
    title: string;
    value: string | number;
    delta: string;
    deltaType: 'increase' | 'decrease' | 'neutral';
    signal: SignalColor;
    sparklineData: number[];
    className?: string;
}

export function MetricCard({ title, value, delta, deltaType, signal, sparklineData, className }: MetricCardProps) {
    const signalHexColors = {
        allow: '#00D68F',
        block: '#FF3B30',
        warn: '#FFB347',
        info: '#00C8FF',
        purple: '#9B59FC',
        disabled: '#4A5260',
    };

    const signalTextClass = {
        allow: 'text-signal-allow',
        block: 'text-signal-block',
        warn: 'text-signal-warn',
        info: 'text-signal-info',
        purple: 'text-signal-purple',
        disabled: 'text-signal-disabled',
    };

    const data = sparklineData.map((val, i) => ({ val, i }));
    const hexColor = signalHexColors[signal];

    return (
        <div
            className={cn(
                "relative flex flex-col p-card rounded-card bg-gradient-to-br from-card to-card-alt border border-border-default",
                "transition-all duration-300 hover:shadow-lg hover:border-border-hover overflow-hidden group",
                className
            )}
        >
            {/* 3px Accent Bar Top */}
            <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: hexColor }}
            />

            <div className="flex justify-between items-start mb-4">
                <h3 className="text-card-title text-[#F5F5F5] uppercase tracking-wider">{title}</h3>
                <div className={cn(
                    "text-status-tag px-2 py-1 rounded bg-black/20",
                    deltaType === 'increase' ? 'text-signal-allow' : deltaType === 'decrease' ? 'text-signal-block' : 'text-body'
                )}>
                    {deltaType === 'increase' ? '↑' : deltaType === 'decrease' ? '↓' : '−'} {delta}
                </div>
            </div>

            <div className="flex flex-col flex-1">
                <div className={cn("text-metric-value font-mono mb-6 transition-colors duration-200", signalTextClass[signal])}>
                    {value}
                </div>

                {/* Sparkline */}
                <div className="h-10 w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Line
                                type="monotone"
                                dataKey="val"
                                stroke={hexColor}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
