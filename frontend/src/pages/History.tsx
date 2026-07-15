import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FileText, Clock, PackageSearch, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PillButton } from '../components/PillButton';
import { useToast } from '../context/ToastContext';
import { useAnalytics } from '../context/AnalyticsContext';

interface HistoryEntry {
    id: string;
    filename: string;
    timestamp: string;
    totalPackets: number;
    dropped: number;
    fileSize: number;
    appBreakdown?: { app: string; count: number; percentage: number }[];
}

function formatRelativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

// Mini sparkline SVG from app breakdown
function Sparkline({ data }: { data?: { count: number }[] }) {
    if (!data || !Array.isArray(data) || data.length < 2) return <span className="text-white/20 text-[10px]">—</span>;
    const vals = data.slice(0, 8).map(d => d.count);
    const max = Math.max(...vals, 1);
    const W = 80, H = 28;
    const pts = vals.map((v, i) => ({
        x: (i / (vals.length - 1)) * W,
        y: H - (v / max) * H,
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
                <linearGradient id="spk" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4B8DFF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
            <path d={d} fill="none" stroke="url(#spk)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill="#a78bfa" />
        </svg>
    );
}

function CompareBar({ a, b, label }: { a: number; b: number; label: string }) {
    const max = Math.max(a, b, 1);
    return (
        <div className="mb-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</div>
            <div className="flex gap-2 items-center">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#4B8DFF]" style={{ width: `${(a / max) * 100}%`, transition: 'width 0.8s ease' }} />
                </div>
                <span className="text-[10px] font-black text-[#4B8DFF] w-12 text-right">{a.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 items-center mt-1">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#a78bfa]" style={{ width: `${(b / max) * 100}%`, transition: 'width 0.8s ease' }} />
                </div>
                <span className="text-[10px] font-black text-[#a78bfa] w-12 text-right">{b.toLocaleString()}</span>
            </div>
        </div>
    );
}

export function History() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [compareA, setCompareA] = useState<string | null>(null);
    const [compareB, setCompareB] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'time' | 'packets' | 'dropped'>('time');
    const { addToast } = useToast();
    const { setAnalytics } = useAnalytics();
    const navigate = useNavigate();

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            if (res.ok) setHistory(await res.json());
        } catch { addToast('Failed to load history', 'error'); }
        setLoading(false);
    };

    useEffect(() => { fetchHistory(); }, []);

    const sorted = [...history].sort((a, b) => {
        if (sortBy === 'packets') return b.totalPackets - a.totalPackets;
        if (sortBy === 'dropped') return b.dropped - a.dropped;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const handleLoad = async (id: string) => {
        try {
            const res = await fetch(`/api/history/${id}`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
                addToast(`Loaded: ${data.filename}`, 'info');
                navigate('/dashboard');
            }
        } catch { addToast('Failed to load entry', 'error'); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(h => h.id !== id));
                if (compareA === id) setCompareA(null);
                if (compareB === id) setCompareB(null);
                addToast('Entry removed', 'info');
            }
        } catch { addToast('Failed to delete', 'error'); }
    };

    const toggleCompare = (id: string) => {
        if (compareA === id) { setCompareA(compareB); setCompareB(null); return; }
        if (compareB === id) { setCompareB(null); return; }
        if (!compareA) { setCompareA(id); return; }
        if (!compareB) { setCompareB(id); return; }
        // swap oldest
        setCompareA(compareB);
        setCompareB(id);
    };

    const entryA = history.find(h => h.id === compareA);
    const entryB = history.find(h => h.id === compareB);

    return (
        <div className="flex flex-col max-w-5xl mx-auto w-full mt-4 pb-16">
            <div className="pt-8">
                <PageHeader titleTop="ANALYSIS" titleBottom="HISTORY" subtitle="Browse, compare, and reload past PCAP analysis sessions." />
            </div>

            {/* Compare Panel */}
            {entryA && (
                <div className="mt-8 bg-[#0d0d0d] border border-white/10 rounded-[24px] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-4 h-4 text-accent-blue" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">
                            {entryB ? 'Comparing Two Runs' : 'Select a second run to compare'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#4B8DFF]" />
                            <span className="text-[#4B8DFF] truncate">{entryA.filename}</span>
                        </div>
                        {entryB && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#a78bfa]" />
                                <span className="text-[#a78bfa] truncate">{entryB.filename}</span>
                            </div>
                        )}
                    </div>
                    {entryB && (
                        <div>
                            <CompareBar a={entryA.totalPackets} b={entryB.totalPackets} label="Total Packets" />
                            <CompareBar a={entryA.dropped} b={entryB.dropped} label="Dropped Packets" />
                            <CompareBar a={entryA.fileSize} b={entryB.fileSize} label="File Size (bytes)" />
                        </div>
                    )}
                    <button onClick={() => { setCompareA(null); setCompareB(null); }}
                        className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                        Clear Compare
                    </button>
                </div>
            )}

            {/* Sort Bar */}
            <div className="flex items-center gap-3 mt-8 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Sort:</span>
                {(['time', 'packets', 'dropped'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-accent-blue text-white' : 'text-white/30 hover:text-white'}`}>
                        {s}
                    </button>
                ))}
                <span className="ml-auto text-[10px] font-mono text-white/30">{history.length} entries</span>
            </div>

            {/* Table */}
            <div className="bg-[#0d0d0d] rounded-[24px] border border-white/[0.06] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
                        <PackageSearch className="w-12 h-12" />
                        <p className="text-sm font-black uppercase tracking-widest">No analysis history yet</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                                <th className="px-6 py-4">File</th>
                                <th className="px-4 py-4">Traffic</th>
                                <th className="px-4 py-4 hidden md:table-cell">Size</th>
                                <th className="px-4 py-4 hidden md:table-cell">Packets</th>
                                <th className="px-4 py-4 hidden lg:table-cell">Dropped</th>
                                <th className="px-4 py-4 hidden sm:table-cell">When</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(entry => {
                                const isA = compareA === entry.id;
                                const isB = compareB === entry.id;
                                const isCompared = isA || isB;
                                return (
                                    <tr key={entry.id}
                                        className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${isCompared ? 'bg-white/[0.03]' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 opacity-30 shrink-0" />
                                                <span className="font-bold text-[12px] text-white/80 truncate max-w-[140px]">{entry.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Sparkline data={entry.appBreakdown} />
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell text-[11px] font-mono text-white/40">{formatSize(entry.fileSize)}</td>
                                        <td className="px-4 py-4 hidden md:table-cell text-[11px] font-mono text-white/60">{entry.totalPackets.toLocaleString()}</td>
                                        <td className="px-4 py-4 hidden lg:table-cell text-[11px] font-mono">
                                            <span className={entry.dropped > 0 ? 'text-signal-block font-black' : 'text-signal-allow'}>{entry.dropped}</span>
                                        </td>
                                        <td className="px-4 py-4 hidden sm:table-cell text-[10px] font-mono text-white/30">{formatRelativeTime(entry.timestamp)}</td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => toggleCompare(entry.id)}
                                                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-colors ${isCompared ? 'bg-accent-blue/30 text-accent-blue' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                                                    {isA ? 'A' : isB ? 'B' : 'CMP'}
                                                </button>
                                                <button onClick={() => handleLoad(entry.id)}
                                                    className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/60 rounded-md hover:bg-accent-blue/20 hover:text-accent-blue transition-colors">
                                                    View
                                                </button>
                                                <button onClick={() => handleDelete(entry.id)}
                                                    className="p-1.5 hover:bg-signal-block/10 rounded-lg transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5 text-signal-block/50 hover:text-signal-block" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-6 flex justify-center">
                <PillButton variant="secondary" onClick={() => navigate('/upload')} className="px-8 py-3 text-[12px]">
                    ← Back to Upload
                </PillButton>
            </div>
        </div>
    );
}
