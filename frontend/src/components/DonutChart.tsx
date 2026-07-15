import { useEffect, useRef, useState } from 'react';

interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    tcp: number;
    udp: number;
    total: number;
}

function useAnimatedValue(target: number, delay = 200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setValue(target), delay);
        return () => clearTimeout(t);
    }, [target, delay]);
    return value;
}

export function DonutChart({ tcp, udp, total }: DonutChartProps) {
    const other = Math.max(0, total - tcp - udp);
    const slices: DonutSlice[] = [
        { label: 'TCP',   value: tcp,   color: '#00c8ff' },
        { label: 'UDP',   value: udp,   color: '#a78bfa' },
        { label: 'Other', value: other, color: '#4a5260' },
    ].filter(s => s.value > 0);

    const animatedTotal = useAnimatedValue(total, 100);

    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const R = 78;
    const r = 52;
    const gap = 0.04; // radians gap between slices

    let currentAngle = -Math.PI / 2;

    const paths = slices.map(slice => {
        const pct = slice.value / Math.max(total, 1);
        const sweep = pct * (2 * Math.PI) - gap;
        const startAngle = currentAngle + gap / 2;
        const endAngle = startAngle + sweep;
        currentAngle += pct * 2 * Math.PI;

        const x1 = cx + R * Math.cos(startAngle);
        const y1 = cy + R * Math.sin(startAngle);
        const x2 = cx + R * Math.cos(endAngle);
        const y2 = cy + R * Math.sin(endAngle);
        const ix1 = cx + r * Math.cos(endAngle);
        const iy1 = cy + r * Math.sin(endAngle);
        const ix2 = cx + r * Math.cos(startAngle);
        const iy2 = cy + r * Math.sin(startAngle);

        const largeArc = sweep > Math.PI ? 1 : 0;

        return {
            d: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2} Z`,
            color: slice.color,
            label: slice.label,
            pct: (pct * 100).toFixed(1),
        };
    });

    return (
        <div className="flex items-center gap-8">
            <div className="relative shrink-0">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        {slices.map((s, i) => (
                            <filter key={i} id={`glow-${i}`}>
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        ))}
                    </defs>
                    {paths.map((p, i) => (
                        <path
                            key={i} d={p.d} fill={p.color}
                            filter={`url(#glow-${i})`}
                            opacity={0.9}
                            className="transition-all duration-700"
                            style={{ filter: `drop-shadow(0 0 6px ${p.color}80)` }}
                        />
                    ))}
                    {/* Center label */}
                    <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="Space Grotesk">
                        {animatedTotal.toLocaleString()}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700" fontFamily="Space Grotesk" letterSpacing="2">
                        PACKETS
                    </text>
                </svg>
            </div>
            <div className="flex flex-col gap-3">
                {paths.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{p.label}</span>
                        <span className="text-[11px] font-black ml-auto pl-4" style={{ color: p.color }}>{p.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
