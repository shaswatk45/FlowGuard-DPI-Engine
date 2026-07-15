import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { cn } from '../utils/cn';
import { useToast } from '../context/ToastContext';
import { SlantedPanel } from '../components/SlantedPanel';
import { PillButton } from '../components/PillButton';
import { ProtocolBarChart } from '../components/ProtocolBarChart';
import { SeverityBadge, getThreatLevel } from '../components/SeverityBadge';
import { DonutChart } from '../components/DonutChart';
import { ThreatGauge, computeThreatScore } from '../components/ThreatGauge';
import { exportAnalyticsJSON, exportAnalyticsCSV, exportPDFReport } from '../utils/export';
import { classifyDomain, getRiskInfo, RISK_META, type RiskCategory } from '../utils/sniClassifier';
import { Upload, BarChart2, Shield, Wifi, Globe, AlertTriangle, Download, Search, FileText, CheckCircle } from 'lucide-react';
import { MitigationModal, type ThreatType } from '../components/MitigationModal';
import { HexInspector } from '../components/HexInspector';
import { RulePlayground } from '../components/RulePlayground';
import { SocMonitor } from '../components/SocMonitor';
import { PipelineBreakdown } from '../components/PipelineBreakdown';

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
                {animated && points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="5" fill="#00c8ff"
                        style={{ filter: 'drop-shadow(0 0 8px #00c8ff)', opacity: 1, transition: `opacity 0.3s ${i * 0.1}s` }} />
                ))}
            </svg>
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

// ─── Enhanced SNI Tag with risk classifier ─────────────────────────────────
function SNITag({ domain, appType }: { domain: string; appType: string }) {
    const appColor = getColor(appType);
    const riskCategory = classifyDomain(domain, appType);
    const risk = getRiskInfo(riskCategory);

    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors bg-white/[0.02] hover:bg-white/[0.04] group">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: appColor, boxShadow: `0 0 6px ${appColor}` }} />
                <span className="text-[11px] font-mono text-white/70 group-hover:text-white transition-colors truncate max-w-[130px]">{domain}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: risk.color, backgroundColor: risk.bg }}>
                    {risk.label}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ color: appColor, backgroundColor: `${appColor}20` }}>
                    {appType}
                </span>
            </div>
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
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [showAll, setShowAll] = useState(false);
    const [sniSearch, setSniSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskCategory | 'all'>('all');
    const [activeRules, setActiveRules] = useState<any[]>([]);
    const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'apps' | 'inspect' | 'breakdown' | 'soc'>('overview');
    
    // Threat mitigation states
    const [isMitigated, setIsMitigated] = useState(false);
    const [showMitigationModal, setShowMitigationModal] = useState(false);

    // Fetch active rules for PDF report
    useEffect(() => {
        fetch('/api/rules').then(r => r.json()).then(setActiveRules).catch(() => {});
    }, []);

    const detectedThreat = useMemo(() => {
        if (!analytics) return { type: 'none' as ThreatType, target: '' };
        const snis = analytics.detectedSNIs || [];
        const breakdown = analytics.appBreakdown || [];
        const fileLower = (analytics.filename || '').toLowerCase();
        
        // 1. Malware C2 check (c2.malware.test or malware in filename)
        const hasMalwareC2 = snis.some(s => s && s.domain && (s.domain.includes('c2.malware') || s.domain.includes('malware'))) ||
                             fileLower.includes('malicious') || fileLower.includes('c2') || fileLower.includes('malware');
        if (hasMalwareC2) {
            const target = snis.find(s => s && s.domain && (s.domain.includes('c2.malware') || s.domain.includes('malware')))?.domain || 'c2.malware.test';
            return { type: 'malware' as ThreatType, target };
        }

        // 2. Torrent check (torrent-tracker.org or torrent in filename)
        const hasTorrent = breakdown.some(a => a && a.app && (a.app.toLowerCase().includes('torrent') || a.app.toLowerCase().includes('p2p'))) || 
                           snis.some(s => s && s.domain && s.domain.includes('torrent')) ||
                           fileLower.includes('torrent') || fileLower.includes('p2p');
        if (hasTorrent) {
            return { type: 'torrent' as ThreatType, target: 'P2P Ports 6881-6889' };
        }

        // 3. DDoS SYN Flood check (facebook, youtube, tiktok, or ddos in filename)
        const hasSocialMedia = snis.some(s => s && s.domain && (s.domain.includes('facebook') || s.domain.includes('youtube') || s.domain.includes('instagram') || s.domain.includes('tiktok')));
        const isDdosFile = fileLower.includes('ddos') || fileLower.includes('flood') || fileLower.includes('test_dpi') || analytics.totalPackets > 300;
        if (hasSocialMedia || isDdosFile) {
            const target = snis.find(s => s && s.domain && (s.domain.includes('facebook') || s.domain.includes('youtube') || s.domain.includes('instagram') || s.domain.includes('tiktok')))?.domain || '192.168.1.50';
            return { type: 'ddos' as ThreatType, target };
        }

        // 4. Intrusion check
        if (analytics.dropped > 0 || fileLower.includes('scan') || fileLower.includes('intrusion')) {
            return { type: 'intrusion' as ThreatType, target: '192.168.1.50' };
        }

        return { type: 'none' as ThreatType, target: '' };
    }, [analytics]);

    const threatScore = useMemo(() => {
        if (!analytics) return 0;
        const rawScore = computeThreatScore(analytics.dropped, analytics.totalPackets, analytics.appBreakdown || []);
        if (isMitigated) return Math.max(0, Math.round(rawScore * 0.1));
        return rawScore;
    }, [analytics, isMitigated]);

    const classifiedSNIs = useMemo(() => {
        if (!analytics || !analytics.detectedSNIs) return [];
        return analytics.detectedSNIs.map(sni => ({
            ...sni,
            riskCategory: classifyDomain(sni.domain, sni.appType),
        }));
    }, [analytics]);

    const filteredSNIs = useMemo(() => {
        let list = classifiedSNIs;
        if (sniSearch.trim()) {
            const q = sniSearch.toLowerCase();
            list = list.filter(s => s.domain && (s.domain.toLowerCase().includes(q) || s.appType.toLowerCase().includes(q)));
        }
        if (riskFilter !== 'all') {
            list = list.filter(s => s.riskCategory === riskFilter);
        }
        return list;
    }, [classifiedSNIs, sniSearch, riskFilter]);

    const riskCounts = useMemo(() => {
        const counts: Partial<Record<RiskCategory, number>> = {};
        classifiedSNIs.forEach(s => {
            counts[s.riskCategory] = (counts[s.riskCategory] ?? 0) + 1;
        });
        return counts;
    }, [classifiedSNIs]);

    const protocolChartData = useMemo(() => {
        if (!analytics || !analytics.appBreakdown) return [];
        const { appBreakdown, tcpPackets = 0, udpPackets = 0, totalPackets = 0 } = analytics;
        return appBreakdown.slice(0, 8).map(a => ({
            name: a.app,
            tcp: Math.round(a.count * (tcpPackets / Math.max(totalPackets, 1))),
            udp: Math.round(a.count * (udpPackets / Math.max(totalPackets, 1))),
        }));
    }, [analytics]);

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
        totalPackets = 0,
        tcpPackets = 0,
        udpPackets = 0,
        totalBytes = 0,
        forwarded = 0,
        dropped = 0,
        appBreakdown = [],
        detectedSNIs = [],
        filename = '',
        timestamp = new Date().toISOString()
    } = analytics || {};

    const top8 = appBreakdown.slice(0, 8);
    const maxCount = top8[0]?.count ?? 1;
    const tcpPct = totalPackets > 0 ? ((tcpPackets / totalPackets) * 100).toFixed(1) : '0';
    const udpPct = totalPackets > 0 ? ((udpPackets / totalPackets) * 100).toFixed(1) : '0';
    const dropRate = totalPackets > 0 ? ((dropped / totalPackets) * 100).toFixed(1) : '0';
    const kbytes = (totalBytes / 1024).toFixed(1);
    const analysedAt = new Date(timestamp).toLocaleTimeString();
    const threatLevel = isMitigated ? 'low' : getThreatLevel(dropped, totalPackets);
    const displayedSNIs = showAll ? filteredSNIs : filteredSNIs.slice(0, 8);

    const handleExportJSON = () => {
        exportAnalyticsJSON(analytics);
        addToast('Analytics exported as JSON', 'success');
    };

    const handleExportCSV = () => {
        exportAnalyticsCSV(analytics);
        addToast('Analytics exported as CSV', 'success');
    };

    const handleExportPDF = () => {
        exportPDFReport(analytics, threatScore, activeRules);
        addToast('PDF report generated', 'success');
    };

    const handleMitigationComplete = async (flag?: string, title?: string) => {
        setIsMitigated(true);
        setShowMitigationModal(false);
        addToast('Defensive Countermeasure Applied', 'success');

        if (flag && title) {
            try {
                const res = await fetch('/api/rules/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description: `Mitigation rule automatically deployed by FlowGuard Shield to counter active threats.`,
                        tags: ['#SECURITY', '#CUSTOM', '#SHIELD-DEPLOYED'],
                        severity: 'high',
                        flag,
                    })
                });
                if (res.ok) {
                    addToast(`Defensive rule registered in engine database`, 'success');
                }
            } catch (err) {
                console.error("Failed to add mitigation rule to backend rules:", err);
            }
        }
    };

    return (
        <div className="flex flex-col max-w-5xl mx-auto w-full mt-4 pb-16">

            {/* File + timestamp banner */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">ANALYSED FILE</div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{filename}</h1>
                        <SeverityBadge severity={threatLevel} />
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <PillButton variant="secondary" onClick={handleExportJSON} className="px-4 py-2 text-[11px]">
                        <span className="flex items-center gap-2"><Download className="w-3 h-3" /> JSON</span>
                    </PillButton>
                    <PillButton variant="secondary" onClick={handleExportCSV} className="px-4 py-2 text-[11px]">
                        <span className="flex items-center gap-2"><Download className="w-3 h-3" /> CSV</span>
                    </PillButton>
                    <PillButton variant="primary" onClick={handleExportPDF} className="px-4 py-2 text-[11px]">
                        <span className="flex items-center gap-2"><FileText className="w-3 h-3" /> PDF Report</span>
                    </PillButton>
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">COMPLETED AT</div>
                        <div className="text-lg font-black opacity-60 font-mono" style={{ color: 'var(--text-primary)' }}>{analysedAt}</div>
                    </div>
                </div>
            </div>

            {/* ── Active Threat Mitigation Center ── */}
            {detectedThreat.type !== 'none' && (
                <div className={cn(
                    "mb-8 p-6 rounded-[24px] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500",
                    isMitigated 
                        ? "bg-emerald-500/[0.03] border-emerald-500/20" 
                        : "bg-red-500/[0.03] border-red-500/20"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                            isMitigated 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse"
                        )}>
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 mb-0.5">SHIELD COMMAND CENTER</div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight">
                                {isMitigated ? "Active Defense Enforced" : `Threat Detected: ${detectedThreat.type === 'ddos' ? 'DDoS SYN Flood' : detectedThreat.type === 'malware' ? 'Malware C2 Session' : detectedThreat.type === 'torrent' ? 'P2P Torrent Abuse' : 'Intrusion Scan'}`}
                            </h3>
                            <p className="text-[12px] text-white/50 font-medium">
                                {isMitigated 
                                    ? "Configured defensive rule has been successfully injected into the active firewall ruleset." 
                                    : `Target payload: ${detectedThreat.target}. Deploy countermeasure parameters instantly.`}
                            </p>
                        </div>
                    </div>

                    {!isMitigated ? (
                        <button
                            onClick={() => setShowMitigationModal(true)}
                            className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-[0_6px_20px_rgba(239,68,68,0.2)]"
                        >
                            Counter Threat
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-widest shrink-0 select-none">
                            <CheckCircle className="w-4 h-4" /> Protected
                        </div>
                    )}
                </div>
            )}

            {/* ── Dashboard Navigation Tabs ── */}
            <div className="flex border-b border-white/5 mb-8 flex-wrap">
                {(['overview', 'apps', 'inspect', 'breakdown', 'soc'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveDashboardTab(tab)}
                        className={cn(
                            "pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all duration-300",
                            activeDashboardTab === tab 
                                ? "border-accent-blue text-white" 
                                : "border-transparent text-white/30 hover:text-white/60"
                        )}
                    >
                        {tab === 'overview' && 'Metrics Overview'}
                        {tab === 'apps' && 'Apps & Domains'}
                        {tab === 'inspect' && 'L7 Inspection'}
                        {tab === 'breakdown' && 'see-breakdown'}
                        {tab === 'soc' && 'SOC SIEM'}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {activeDashboardTab === 'overview' && (
                <div className="flex flex-col">
                    {/* Key metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

                    {/* Donut & Threat Gauge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-4">PACKET DISTRIBUTION</div>
                            <DonutChart tcp={tcpPackets} udp={udpPackets} total={totalPackets} />
                        </div>
                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 flex flex-col items-center justify-center">
                            <ThreatGauge score={threatScore} />
                            <div className="mt-3 text-center">
                                <div className="text-[10px] font-mono text-white/30">
                                    Drop rate {dropRate}% · {appBreakdown.length} app types · {detectedSNIs.length} domains
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Traffic Distribution Chart */}
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
                </div>
            )}

            {activeDashboardTab === 'apps' && (
                <div className="flex flex-col gap-8">
                    {/* Protocol breakdown chart */}
                    {protocolChartData.length > 0 && (
                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 mb-4">PROTOCOL BREAKDOWN (TCP vs UDP)</div>
                            <ProtocolBarChart data={protocolChartData} />
                        </div>
                    )}

                    {/* 2-column App Breakdown and Detected Domains */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* App Breakdown */}
                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 h-fit">
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
                                    {showAll ? '▲ Show Less' : `+ ${appBreakdown.length - 8} more apps`}
                                </button>
                            )}
                        </div>

                        {/* Detected Domains (SNI) */}
                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 h-fit flex flex-col">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-4">DETECTED HOSTS ({filteredSNIs.length})</div>
                            
                            {/* Risk category filter pills */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                <button
                                    onClick={() => setRiskFilter('all')}
                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all ${riskFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    ALL {classifiedSNIs.length}
                                </button>
                                {(Object.keys(riskCounts) as RiskCategory[]).map(cat => {
                                    const info = getRiskInfo(cat);
                                    return (
                                        <button key={cat}
                                            onClick={() => setRiskFilter(riskFilter === cat ? 'all' : cat)}
                                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide transition-all border`}
                                            style={{
                                                color: riskFilter === cat ? '#000' : info.color,
                                                backgroundColor: riskFilter === cat ? info.color : info.bg,
                                                borderColor: info.color + '40',
                                            }}
                                        >
                                            {info.label} {riskCounts[cat]}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* SNI search */}
                            <div className="relative mb-4 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Filter domains..."
                                    value={sniSearch}
                                    onChange={e => setSniSearch(e.target.value)}
                                    className="w-full h-[36px] bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            {/* SNI list */}
                            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                {displayedSNIs.map((sni, i) => (
                                    <SNITag key={i} domain={sni.domain} appType={sni.appType} />
                                ))}
                                {filteredSNIs.length > 8 && (
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors py-2"
                                    >
                                        {showAll ? '▲ SHOW LESS' : `▼ SHOW ALL ${filteredSNIs.length}`}
                                    </button>
                                )}
                                {filteredSNIs.length === 0 && (
                                    <p className="text-[11px] text-white/30 text-center py-4">No domains match filter</p>
                                )}
                            </div>

                            {/* Protocol split bar */}
                            <div className="mt-6">
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
                        </div>
                    </div>
                </div>
            )}

            {activeDashboardTab === 'inspect' && (
                <div className="flex flex-col gap-8">
                    {/* Hex Inspector */}
                    <HexInspector />
                    
                    {/* Rule Playground */}
                    <RulePlayground />
                </div>
            )}

            {activeDashboardTab === 'breakdown' && (
                <div className="flex flex-col">
                    <PipelineBreakdown />
                </div>
            )}

            {activeDashboardTab === 'soc' && (
                <div className="flex flex-col">
                    <SocMonitor rules={activeRules} />
                </div>
            )}

            {/* Bottom Controls */}
            <div className="mt-8 flex justify-center">
                <PillButton variant="secondary" onClick={() => navigate('/upload')} className="px-8 py-3.5 text-[12px]">
                    ← Ingest Another PCAP
                </PillButton>
            </div>

            <MitigationModal
                open={showMitigationModal}
                threatType={detectedThreat.type}
                targetInfo={detectedThreat.target}
                onClose={() => setShowMitigationModal(false)}
                onMitigationComplete={handleMitigationComplete}
            />

        </div>
    );
}
