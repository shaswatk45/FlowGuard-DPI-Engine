import { useEffect, useState } from 'react';

interface ThreatGaugeProps {
    score: number; // 0-100
}

function scoreColor(score: number): string {
    if (score < 30) return '#34d399'; // green
    if (score < 60) return '#fbbf24'; // yellow
    if (score < 80) return '#f97316'; // orange
    return '#ff4d4f'; // red
}

function scoreLabel(score: number): string {
    if (score < 20) return 'CLEAN';
    if (score < 40) return 'LOW RISK';
    if (score < 60) return 'MODERATE';
    if (score < 80) return 'HIGH RISK';
    return 'CRITICAL';
}

export function computeThreatScore(dropped: number, total: number, appBreakdown: { app: string; count: number; percentage: number }[]): number {
    if (!total || total === 0) return 0;
    const dropRate = (dropped || 0) / total;
    const safeAppBreakdown = appBreakdown || [];
    const unknownPct = (safeAppBreakdown.find(a => a && a.app === 'Unknown')?.percentage ?? 0) / 100;
    const highTrafficApps = safeAppBreakdown.filter(a => a && ['YouTube', 'Facebook', 'TikTok', 'BitTorrent'].includes(a.app)).length;

    const score = Math.min(100, Math.round(
        dropRate * 60 +
        unknownPct * 25 +
        highTrafficApps * 3
    ));
    return isNaN(score) ? 0 : score;
}

export function ThreatGauge({ score = 0 }: ThreatGaugeProps) {
    const safeScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    const [animated, setAnimated] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setAnimated(safeScore), 300);
        return () => clearTimeout(t);
    }, [safeScore]);

    const displayScore = isNaN(animated) ? 0 : animated;
    const color = scoreColor(displayScore);
    const label = scoreLabel(displayScore);

    // Arc params
    const W = 220, H = 130;
    const cx = W / 2, cy = H - 10;
    const R = 90;
    const startAngle = Math.PI;      // 180°
    const endAngle = 0;              // 0° (full arc = semicircle)
    const arcLength = Math.PI;       // total arc = 180°

    // Background arc
    const bgX1 = cx + R * Math.cos(startAngle);
    const bgY1 = cy + R * Math.sin(startAngle);
    const bgX2 = cx + R * Math.cos(endAngle);
    const bgY2 = cy + R * Math.sin(endAngle);
    const bgPath = `M ${bgX1} ${bgY1} A ${R} ${R} 0 1 1 ${bgX2} ${bgY2}`;

    // Value arc
    const pct = displayScore / 100;
    const valueAngle = startAngle + arcLength * pct;
    const vx = cx + R * Math.cos(valueAngle);
    const vy = cy + R * Math.sin(valueAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const valuePath = pct === 0 ? '' : `M ${bgX1} ${bgY1} A ${R} ${R} 0 ${largeArc} 1 ${vx} ${vy}`;

    // Needle
    const needleAngle = startAngle + arcLength * pct;
    const nLen = 68;
    const nx = cx + nLen * Math.cos(needleAngle);
    const ny = cy + nLen * Math.sin(needleAngle);

    return (
        <div className="flex flex-col items-center">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <defs>
                    <filter id="gaugeGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#ff4d4f" />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" strokeLinecap="round" />

                {/* Gradient background hint */}
                <path d={bgPath} fill="none" stroke="url(#arcGrad)" strokeWidth="12" strokeLinecap="round" opacity={0.15} />

                {/* Value arc */}
                {valuePath && (
                    <path
                        d={valuePath} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                        filter="url(#gaugeGlow)"
                        style={{ transition: 'all 1s cubic-bezier(0.4,0,0.2,1)' }}
                    />
                )}

                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map(tick => {
                    const a = startAngle + arcLength * (tick / 100);
                    const r1 = R + 10, r2 = R + 18;
                    return (
                        <line key={tick}
                            x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
                            x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
                            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"
                        />
                    );
                })}

                {/* Needle */}
                <line x1={cx} y1={cy} x2={nx} y2={ny}
                    stroke={color} strokeWidth="2.5" strokeLinecap="round"
                    filter="url(#gaugeGlow)"
                    style={{ transition: 'all 1s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <circle cx={cx} cy={cy} r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />

                {/* Score number */}
                <text x={cx} y={cy - 28} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="Space Grotesk">
                    {animated}
                </text>
                <text x={cx} y={cy - 12} textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="Space Grotesk" letterSpacing="3">
                    {label}
                </text>

                {/* Min / Max labels */}
                <text x={15} y={cy + 18} fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="700" fontFamily="Space Grotesk">0</text>
                <text x={W - 22} y={cy + 18} fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="700" fontFamily="Space Grotesk">100</text>
            </svg>

            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 -mt-2">THREAT SCORE</div>
        </div>
    );
}
