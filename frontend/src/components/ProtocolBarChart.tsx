import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { cn } from '../utils/cn';

interface ProtocolData {
    name: string;
    tcp: number;
    udp: number;
}

interface ProtocolBarChartProps {
    data: ProtocolData[];
    className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card-alt border border-border-default rounded-card p-3 shadow-xl">
                <p className="font-sans font-bold text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex justify-between items-center space-x-4 mb-1">
                        <span className="text-identifier-label" style={{ color: entry.color }}>
                            {entry.name.toUpperCase()}
                        </span>
                        <span className="font-mono text-table-data text-white font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function ProtocolBarChart({ data, className }: ProtocolBarChartProps) {
    return (
        <div className={cn("w-full h-[300px] bg-card rounded-card p-card border border-border-default", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4A5260', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4A5260', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: '#ffffff', opacity: 0.04 }}
                    />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: '#A0A4A8' }}
                    />
                    <Bar dataKey="tcp" name="TCP FLOWS" fill="#00C8FF" radius={[4, 4, 4, 4]} barSize={12} />
                    <Bar dataKey="udp" name="UDP FLOWS" fill="#FFB347" radius={[4, 4, 4, 4]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
 
