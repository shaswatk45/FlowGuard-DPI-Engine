import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { SlantedPanel } from '../components/SlantedPanel';
import { PillButton } from '../components/PillButton';
import { Upload, BarChart2, Shield, Wifi, Globe, AlertTriangle } from 'lucide-react';

// ─── Color map for app types ───────────────────────────────────────────────
const APP_COLORS: Record<string, string> = {
    HTTPS:       '#00c8ff',
    HTTP:        '#4a9eff',
    DNS:         '#a78bfa',
    TLS:         '#38bdf8',
    QUIC:        '#34d399',
    Google:      '#4285f4',
    YouTube:     '#ff0000',
    Facebook:    '#1877f2',
    Instagram:   '#e1306c',
    Twitter:     '#1da1f2',
    'Twitter/X': '#1da1f2',
    Netflix:     '#e50914',
    Amazon:      '#ff9900',
    Microsoft:   '#00a4ef',
    Apple:       '#a2aaad',
    WhatsApp:    '#25d366',
    Telegram:    '#2ca5e0',
    TikTok:      '#ff0050',
    Spotify:     '#1db954',
    Zoom:        '#2d8cff',
    Discord:     '#5865f2',
    GitHub:      '#f0f6fc',
    Cloudflare:  '#f6821f',
    Unknown:     '#444455',
};

function getColor(app: string) {
    return APP_COLORS[app] ?? '#666688';
}

// ─── Animated horizontal bar ──────────────────────────────────────────────
function AppBar({ app, count, percentage, maxCount, delay }: {
    app: string; count: number; percentage: number; maxCount: number; delay: number;
}) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth((count / maxCount) * 100), delay);
        return () => clearTimeout(t);
    }, [count, maxCount, delay]);

    const color = getColor(app);
    return (
        <div className="flex items-center gap-3 group">
            <div className="w-24 text-right text-[11px] font-bold tracking-wider text-white/60 uppercase shrink-0 group-hover:text-white transition-colors">
                {app}
            </div>
            <div className="flex-1 h-[6px] bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${width}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}60`, transitionDelay: `${delay}ms` }}
                />
            </div>
            <div className="w-16 text-left text-[11px] font-black shrink-0" style={{ color }}>
                {count} <span className="text-white/30 font-normal">({percentage.toFixed(1)}%)</span>
            </div>
        </div>
    );
}

// ─── Animated SVG line chart from real data ───────────────────────────────
function TrafficChart({ data }: { data: { app: string; count: number }[] }) {
    const pathRef = useRef<SVGPathElement>(null);
    const [animated, setAnimated] = useState(false);

    const W = 1000, H = 220;
    const top = data.slice(0, 10);
    const maxVal = Math.max(...top.map(d => d.count), 1);

    // Build smooth cubic bezier path from data points
    const points = top.map((d, i) => ({
        x: (i / Math.max(top.length - 1, 1)) * W,
        y: H - 20 - ((d.count / maxVal) * (H - 50))
    }));

    let pathD = '';
    if (points.length > 0) {
        pathD = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const cp1x = (points[i - 1].x + points[i].x) / 2;
            pathD += ` C ${cp1x},${points[i - 1].y} ${cp1x},${points[i].y} ${points[i].x},${points[i].y}`;
        }
    }

    // Area path (fill)
    const areaD = pathD
        ? `${pathD} L ${points[points.length - 1].x},${H} L ${points[0].x},${H} Z`
        : '';

    useEffect(() => {
        if (!pathRef.current || points.length === 0) return;
        const len = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = `${len}`;
        pathRef.current.style.strokeDashoffset = `${len}`;
        const t = setTimeout(() => {
            if (pathRef.current) {
                pathRef.current.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)';
                pathRef.current.style.strokeDashoffset = '0';
            }
            setAnimated(true);
        }, 200);
        return () => clearTimeout(t);
    }, [pathD]);

    return (
        <div className="relative w-full h-[240px]">
            {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:80px_40px] rounded-2xl" />
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00c8ff" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00c8ff" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {areaD && <path d={areaD} fill="url(#areaGrad)" opacity={animated ? 1 : 0} style={{ transition: 'opacity 0.5s 1.5s' }} />}
                {pathD && (
                    <path ref={pathRef} d={pathD} fill="none" stroke="#00c8ff" strokeWidth="3"
                        strokeLinecap="round" filter="url(#glow)" />
                )}
                {/* Data point dots */}
                {animated && points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="5" fill="#00c8ff"
                        style={{ filter: 'drop-shadow(0 0 8px #00c8ff)', opacity: 1, transition: `opacity 0.3s ${i * 0.1}s` }} />
                ))}
            </svg>
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {top.map((d, i) => (
                    <span key={i} className="text-[9px] font-bold uppercase tracking-wider text-white/30 truncate max-w-[80px]">
                        {d.app}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── SNI Badge colors ─────────────────────────────────────────────────────
function SNITag({ domain, appType }: { domain: string; appType: string }) {
    const color = getColor(appType);
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors bg-white/[0.02] hover:bg-white/[0.04] group">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-[11px] font-mono text-white/70 group-hover:text-white transition-colors truncate max-w-[160px]">{domain}</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ml-2"
                style={{ color, backgroundColor: `${color}20` }}>
                {appType}
            </span>
        </div>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#00c8ff', icon }: {
    label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) {
    return (
        <div className="bg-[#0a0a0a] rounded-[20px] border border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-all group"
            style={{ '--hover-color': color } as any}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
                {icon && <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>}
            </div>
            <div>
                <div className="text-[36px] font-black leading-none text-white mb-1"
                    style={{ textShadow: `0 0 30px ${color}40` }}>
                    {value}
                </div>
                {sub && <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{sub}</div>}
            </div>
            <div className="h-0.5 w-full mt-4 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: color, opacity: 0.4 }} />
            </div>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
            <div className="relative">
                <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
                    <BarChart2 className="w-16 h-16 text-white/20" />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping border border-white/5" style={{ animationDuration: '3s' }} />
            </div>
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white/30 mb-3">No Analysis Data</h2>
                <p className="text-white/20 text-sm font-medium max-w-sm">
                    Upload a PCAP file and run the DPI engine to see live analytics here.
                </p>
            </div>
            <PillButton variant="primary" onClick={onUpload} className="px-10 py-4">
                <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    UPLOAD PCAP FILE
                </span>
            </PillButton>
        </div>
    );
}

// ─── Main Dashboard component ─────────────────────────────────────────────
export function Dashboard() {
    const { analytics, isLoading } = useAnalytics();
    const navigate = useNavigate();
    const [showAll, setShowAll] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">LOADING ANALYSIS DATA...</span>
            </div>
        );
    }

    if (!analytics) {
        return <EmptyState onUpload={() => navigate('/upload')} />;
    }

    const {
        totalPackets, tcpPackets, udpPackets, totalBytes,
        forwarded, dropped, appBreakdown, detectedSNIs,
        filename, timestamp
    } = analytics;

    const top8 = appBreakdown.slice(0, 8);
    const maxCount = top8[0]?.count ?? 1;
    const tcpPct = totalPackets > 0 ? ((tcpPackets / totalPackets) * 100).toFixed(1) : '0';
    const udpPct = totalPackets > 0 ? ((udpPackets / totalPackets) * 100).toFixed(1) : '0';
    const dropRate = totalPackets > 0 ? ((dropped / totalPackets) * 100).toFixed(1) : '0';
    const kbytes = (totalBytes / 1024).toFixed(1);
    const analysedAt = new Date(timestamp).toLocaleTimeString();
    const displayedSNIs = showAll ? detectedSNIs : detectedSNIs.slice(0, 8);

    return (
        <div className="flex flex-col xl:flex-row gap-12 w-full mt-4">

            {/* ── Left: main analytics ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* File + timestamp banner */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">ANALYSED FILE</div>
                        <h1 className="text-2xl font-black text-white tracking-tight">{filename}</h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">COMPLETED AT</div>
                        <div className="text-lg font-black text-white/60 font-mono">{analysedAt}</div>
                    </div>
                </div>

                {/* ── Key metric cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Total Packets" value={String(totalPackets)} sub="captured"
                        color="#00c8ff" icon={<Wifi className="w-4 h-4 text-[#00c8ff]" />} />
                    <StatCard label="TCP / UDP" value={`${tcpPct}%`} sub={`TCP · UDP ${udpPct}%`}
                        color="#a78bfa" icon={<Globe className="w-4 h-4 text-purple-400" />} />
                    <StatCard label="Forwarded" value={String(forwarded)} sub={`${kbytes} KB total`}
                        color="#34d399" icon={<Shield className="w-4 h-4 text-emerald-400" />} />
                    <StatCard label="Dropped" value={String(dropped)} sub={`${dropRate}% drop rate`}
                        color={dropped > 0 ? '#ff4d4f' : '#34d399'}
                        icon={<AlertTriangle className={`w-4 h-4 ${dropped > 0 ? 'text-red-400' : 'text-emerald-400'}`} />} />
                </div>

                {/* ── Traffic distribution chart ── */}
                <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">TRAFFIC DISTRIBUTION</div>
                            <div className="text-sm font-bold text-white/60">Packet count by application type (top 10)</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00c8ff] shadow-[0_0_8px_#00c8ff]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">INBOUND ANALYSIS</span>
                        </div>
                    </div>
                    <TrafficChart data={appBreakdown} />
                </div>

                {/* ── App breakdown bars ── */}
                <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 mb-8">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-6">APPLICATION BREAKDOWN</div>
                    <div className="flex flex-col gap-4">
                        {top8.map((stat, i) => (
                            <AppBar
                                key={stat.app}
                                app={stat.app}
                                count={stat.count}
                                percentage={stat.percentage}
                                maxCount={maxCount}
                                delay={i * 80}
                            />
                        ))}
                    </div>
                    {appBreakdown.length > 8 && (
                        <button
                            className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                            onClick={() => setShowAll(!showAll)}
                        >
                            + {appBreakdown.length - 8} more apps
                        </button>
                    )}
                </div>

            </div>

            {/* ── Right: slanted panel with SNIs & controls ── */}
            <div className="w-full xl:w-[360px] shrink-0">
                <SlantedPanel variant="blue" className="w-[105%] -ml-[5%] pl-[5%]">
                    <div className="flex flex-col h-full text-white pt-10 pr-4 pl-2">

                        <h2 className="text-[40px] font-black italic uppercase leading-[0.9] tracking-tighter mb-2">
                            DETECTED<br />DOMAINS
                        </h2>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-8">
                            {detectedSNIs.length} SNI / HOST ENTRIES
                        </div>

                        {/* SNI list */}
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 max-h-[480px]"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                            {displayedSNIs.map((sni, i) => (
                                <SNITag key={i} domain={sni.domain} appType={sni.appType} />
                            ))}
                            {detectedSNIs.length > 8 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors py-2"
                                >
                                    {showAll ? '▲ SHOW LESS' : `▼ SHOW ALL ${detectedSNIs.length}`}
                                </button>
                            )}
                        </div>

                        {/* Protocol split bar */}
                        <div className="mt-8 mb-6">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
                                <span>TCP {tcpPct}%</span>
                                <span>UDP {udpPct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${tcpPct}%`,
                                        background: 'linear-gradient(90deg, #00c8ff, #a78bfa)',
                                        boxShadow: '0 0 12px rgba(0,200,255,0.5)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* App count summary */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-black/30 rounded-xl p-3 text-center">
                                <div className="text-2xl font-black text-white">{appBreakdown.length}</div>
                                <div className="text-[9px] uppercase font-black tracking-widest text-white/40">APP TYPES</div>
                            </div>
                            <div className="bg-black/30 rounded-xl p-3 text-center">
                                <div className="text-2xl font-black text-white">{detectedSNIs.length}</div>
                                <div className="text-[9px] uppercase font-black tracking-widest text-white/40">DOMAINS</div>
                            </div>
                        </div>

                        <PillButton
                            variant="secondary"
                            className="w-full h-14 mb-10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                            onClick={() => navigate('/upload')}
                        >
                            <span className="flex items-center gap-2 justify-center">
                                <Upload className="w-4 h-4" />
                                ANALYSE NEW FILE
                            </span>
                        </PillButton>
                    </div>
                </SlantedPanel>
            </div>

        </div>
    );
}
 
