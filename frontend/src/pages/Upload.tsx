import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PcapDropZone } from '../components/PcapDropZone';
import { ProgressLog } from '../components/ProgressLog';
import { PageHeader } from '../components/PageHeader';
import { PillButton } from '../components/PillButton';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { useAnalytics } from '../context/AnalyticsContext';
import { useToast } from '../context/ToastContext';
import { Activity, FileText, BarChart2, X, Trash2, Clock, Cpu, Shield, Globe } from 'lucide-react';

interface HistoryEntry {
    id: string;
    filename: string;
    timestamp: string;
    totalPackets: number;
    dropped: number;
    fileSize: number;
}

interface LiveStats {
    totalPackets: number;
    activeRules: number;
    detectedDomains: number;
    lastFile: string;
}

function formatRelativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'JUST NOW';
    if (mins < 60) return `${mins} MIN AGO`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} HOUR${hrs > 1 ? 'S' : ''} AGO`;
    return `${Math.floor(hrs / 24)} DAY${Math.floor(hrs / 24) > 1 ? 'S' : ''} AGO`;
}

function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
    const [val, setVal] = useState(0);
    const prev = useRef(0);
    useEffect(() => {
        if (target === prev.current) return;
        const start = prev.current;
        const diff = target - start;
        const startTime = performance.now();
        const step = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.round(start + diff * eased));
            if (t < 1) requestAnimationFrame(step);
            else prev.current = target;
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return val;
}

// Live stat mini-card for the hero
function LiveStatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const animated = useCountUp(value);
    return (
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-4 rounded-[18px] border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
            <div style={{ color }} className="mb-1">{icon}</div>
            <div className="text-2xl font-black text-white font-mono leading-none">{animated.toLocaleString()}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{label}</div>
        </div>
    );
}

export function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [done, setDone] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [liveStats, setLiveStats] = useState<LiveStats>({ totalPackets: 0, activeRules: 0, detectedDomains: 0, lastFile: '' });
    const { setAnalytics } = useAnalytics();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const [scrollOffset, setScrollOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollOffset(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            if (res.ok) setHistory(await res.json());
        } catch { /* ignore */ }
    };

    const fetchLiveStats = async () => {
        try {
            const [rulesRes, analysisRes] = await Promise.all([
                fetch('/api/rules'),
                fetch('/api/latest-analysis').catch(() => null),
            ]);
            const rules = rulesRes.ok ? await rulesRes.json() : [];
            const analysis = analysisRes?.ok ? await analysisRes.json() : null;
            setLiveStats({
                totalPackets: analysis?.totalPackets ?? 0,
                activeRules: rules.filter((r: any) => r.enabled).length,
                detectedDomains: analysis?.detectedSNIs?.length ?? 0,
                lastFile: analysis?.filename ?? '',
            });
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchHistory();
        fetchLiveStats();
        const interval = setInterval(fetchLiveStats, 20000);
        return () => clearInterval(interval);
    }, []);

    const handleCancel = () => {
        abortRef.current?.abort();
        setIsProcessing(false);
        setProgress(0);
        addToast('Analysis cancelled', 'warn');
    };

    const handleStartAnalysis = () => {
        if (!file) return;

        setIsProcessing(true);
        setDone(false);
        setLogs([{ id: '1', time: new Date().toISOString().slice(11, 19), level: 'info', message: `Sending ${file.name} to Deep Packet Inspection Edge...` }]);
        setProgress(5);

        const formData = new FormData();
        formData.append('pcap', file);

        const xhr = new XMLHttpRequest();
        const abortController = new AbortController();
        abortRef.current = abortController;

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 40) + 5);
            }
        });

        xhr.addEventListener('load', () => {
            setProgress(90);
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (data.analytics) setAnalytics(data.analytics);
                    setLogs(prev => [
                        ...prev,
                        { id: 'ok', time: new Date().toISOString().slice(11, 19), level: 'success', message: `Analysis complete — ${data.analytics?.totalPackets ?? '?'} packets, ${data.analytics?.appBreakdown?.length ?? 0} application types detected.` },
                        ...(data.logs || [])
                    ]);
                    setProgress(100);
                    setDone(true);
                    fetchHistory();
                    fetchLiveStats();
                    addToast('PCAP analysis complete', 'success');
                } else {
                    setLogs(prev => [...prev, { id: 'err', time: new Date().toISOString().slice(11, 19), level: 'error', message: data.error || 'Execution failed.' }]);
                    setProgress(0);
                    addToast(data.error || 'Analysis failed', 'error');
                }
            } catch {
                addToast('Invalid server response', 'error');
                setProgress(0);
            }
            setIsProcessing(false);
        });

        xhr.addEventListener('error', () => {
            setLogs(prev => [...prev, { id: 'err', time: new Date().toISOString().slice(11, 19), level: 'error', message: 'Network error during upload.' }]);
            setProgress(0);
            setIsProcessing(false);
            addToast('Upload failed', 'error');
        });

        xhr.addEventListener('abort', () => {
            setLogs(prev => [...prev, { id: 'cancel', time: new Date().toISOString().slice(11, 19), level: 'warn', message: 'Analysis cancelled by user.' }]);
        });

        abortController.signal.addEventListener('abort', () => xhr.abort());

        xhr.open('POST', '/api/analyze');
        xhr.send(formData);
        setProgress(10);
    };

    const handleLoadHistory = async (id: string) => {
        try {
            const res = await fetch(`/api/history/${id}`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
                addToast(`Loaded analysis: ${data.filename}`, 'info');
                navigate('/dashboard');
            }
        } catch {
            addToast('Failed to load history entry', 'error');
        }
    };

    const handleDeleteHistory = async (id: string) => {
        try {
            const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(h => h.id !== id));
                addToast('History entry removed', 'info');
            }
        } catch {
            addToast('Failed to delete entry', 'error');
        }
    };

    const showHero = !isProcessing && logs.length === 0;

    return (
        <div className="flex flex-col max-w-5xl mx-auto w-full mt-4 relative">
            <div className="tubelight-glow" style={{ opacity: Math.min(1, 0.4 + scrollOffset / 300) }} />
            <div className="tubelight-ambient" style={{ 
                opacity: Math.min(1, 0.3 + scrollOffset / 400), 
                transform: `translateX(-50%) translateY(-60%) scale(${1 + Math.min(0.3, scrollOffset / 700)})` 
            }} />
            
            <div className="flex-1 flex flex-col pt-8">
                <PageHeader
                    titleTop="DATA"
                    titleBottom="INGEST"
                    subtitle="Upload network captures for deep behavioral and structural analysis against the current ruleset."
                />

                {/* ── Animated Hero (Particle Canvas + Live Stats) ── */}
                {showHero && (
                    <div className="relative mt-8 mb-6 rounded-[24px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
                        style={{ minHeight: 180 }}>
                        <ParticleCanvas />
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-8">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">ENGINE STATUS</div>
                                <div className="text-xl font-black text-white tracking-tight">
                                    {liveStats.lastFile ? (
                                        <>Last: <span className="text-accent-blue font-mono text-base">{liveStats.lastFile}</span></>
                                    ) : (
                                        <span className="text-white/30">Awaiting first analysis</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 flex-wrap justify-center">
                                <LiveStatCard
                                    icon={<Cpu className="w-5 h-5" />}
                                    label="Packets Analysed"
                                    value={liveStats.totalPackets}
                                    color="#00c8ff"
                                />
                                <LiveStatCard
                                    icon={<Shield className="w-5 h-5" />}
                                    label="Active Rules"
                                    value={liveStats.activeRules}
                                    color="#34d399"
                                />
                                <LiveStatCard
                                    icon={<Globe className="w-5 h-5" />}
                                    label="Domains Found"
                                    value={liveStats.detectedDomains}
                                    color="#a78bfa"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-2 mb-8">
                    <PcapDropZone onFileSelect={setFile} />
                </div>

                <div className="flex items-center gap-4 mb-12 flex-wrap">
                    <PillButton
                        variant="primary"
                        onClick={handleStartAnalysis}
                        disabled={!file || isProcessing}
                        className="px-12 py-4 text-[14px]"
                    >
                        {isProcessing ? (
                            <span className="flex items-center space-x-3">
                                <Activity className="w-5 h-5 animate-spin" />
                                <span>PROCESSING {progress}%</span>
                            </span>
                        ) : (
                            'EXECUTE ANALYSIS'
                        )}
                    </PillButton>

                    {isProcessing && (
                        <PillButton variant="secondary" onClick={handleCancel} className="px-8 py-4 text-[14px]">
                            <span className="flex items-center gap-2">
                                <X className="w-4 h-4" /> CANCEL
                            </span>
                        </PillButton>
                    )}

                    {done && (
                        <PillButton variant="secondary" onClick={() => navigate('/dashboard')} className="px-10 py-4 text-[14px]">
                            <span className="flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" /> VIEW ANALYTICS
                            </span>
                        </PillButton>
                    )}
                </div>

                {isProcessing || logs.length > 0 ? (
                    <div className="mt-8">
                        <h3 className="text-[14px] font-black tracking-widest opacity-50 uppercase mb-4">Engine Output Log</h3>
                        <ProgressLog logs={logs} progress={progress} className="h-64 rounded-[24px] border-border-default bg-card" />
                    </div>
                ) : (
                    <div className="mt-8 flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[12px] font-black tracking-widest opacity-50 uppercase">Recent Ingestions</h3>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-[10px] font-bold text-accent-blue tracking-widest hover:opacity-80 transition-colors"
                            >
                                {showHistory ? 'HIDE HISTORY' : 'VIEW ALL HISTORY'}
                            </button>
                        </div>

                        <div className="bg-card rounded-[24px] border border-border-default overflow-hidden">
                            {history.length === 0 ? (
                                <div className="py-16 text-center opacity-40">
                                    <Clock className="w-8 h-8 mx-auto mb-3" />
                                    <p className="text-sm font-bold uppercase tracking-widest">No analysis history yet</p>
                                    <p className="text-xs mt-2">Upload a PCAP file to get started</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border-default text-[10px] font-black uppercase tracking-widest opacity-40">
                                            <th className="px-6 py-3">File</th>
                                            <th className="px-6 py-3">Size</th>
                                            <th className="px-6 py-3">Packets</th>
                                            <th className="px-6 py-3">When</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[12px] font-mono">
                                        {(showHistory ? history : history.slice(0, 5)).map(entry => (
                                            <tr key={entry.id} className="border-b border-border-default hover:bg-white/[0.02] transition-colors h-[56px]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <FileText className="w-4 h-4 opacity-30" />
                                                        <span className="font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                                                            {entry.filename}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 opacity-60">{formatSize(entry.fileSize)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="opacity-60">{entry.totalPackets.toLocaleString()}</span>
                                                    {entry.dropped > 0 && (
                                                        <span className="ml-2 text-signal-block text-[10px] font-black">{entry.dropped} dropped</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 opacity-60">{formatRelativeTime(entry.timestamp)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleLoadHistory(entry.id)}
                                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-accent-blue/10 text-accent-blue rounded-lg hover:bg-accent-blue/20 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHistory(entry.id)}
                                                            className="p-2 hover:bg-signal-block/10 rounded-full transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-signal-block/60" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
