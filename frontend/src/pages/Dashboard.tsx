import { useState, useEffect } from 'react';
import { SlantedPanel } from '../components/SlantedPanel';
import { PillButton } from '../components/PillButton';
import { Activity, ShieldAlert, Network } from 'lucide-react';

interface Stats {
    uptime: string;
    systemLoad: string;
    peakProcessing: string;
    threatsMitigated: string;
    globalNodes: number;
    coreEngine: string;
    dbLatency: string;
    memoryLoad: string;
}

export function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };

        fetchStats();
        // Poll every 2 seconds for fresh metrics
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col xl:flex-row gap-16 w-full mt-4">

            {/* Left Main Content */}
            <div className="flex-1 flex flex-col pt-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-6">REAL-TIME PERFORMANCE</h3>

                <div className="flex justify-between items-end mb-12">
                    <h1 className="text-[120px] font-black tracking-tighter leading-none text-white whitespace-nowrap">
                        {stats?.uptime || '---'} <span className="text-accent-blue italic">UPTIME</span>
                    </h1>
                    <div className="flex flex-col items-end mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">SYSTEM LOAD</span>
                        <span className="text-5xl font-black text-white">{stats?.systemLoad || '--'}<span className="text-xl text-white/50 italic ml-1">ms</span></span>
                    </div>
                </div>

                {/* Main Graph Area */}
                <div className="w-full h-[400px] bg-[#0c0c0c] rounded-[32px] border border-white/5 p-8 relative overflow-hidden mb-12">
                    {/* Mock Graph Points & Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                    <div className="relative z-10 flex space-x-8 mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-signal-info shadow-[0_0_10px_rgba(0,200,255,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">INBOUND TRAFFIC</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-signal-block shadow-[0_0_10px_rgba(255,77,79,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">OUTBOUND TRAFFIC</span>
                        </div>
                    </div>

                    {/* SVG Mock Line Chart - Pure CSS/SVG representation of the curves */}
                    <svg className="absolute bottom-12 left-0 right-0 w-full h-[200px]" preserveAspectRatio="none" viewBox="0 0 1000 200">
                        <path d="M0,150 C200,160 300,120 500,140 C700,160 850,80 1000,120" fill="none" stroke="#ff4d4f" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_15px_rgba(255,77,79,0.6)]" />
                        <path d="M0,130 C150,110 350,150 550,120 C750,90 850,140 1000,100" fill="none" stroke="#00c8ff" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_15px_rgba(0,200,255,0.6)]" />
                    </svg>

                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[200px] font-black italic text-white/[0.02] -z-0">RAW</span>
                </div>

                {/* Bottom Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-8 flex flex-col justify-between hover:border-signal-info/30 transition-colors group">
                        <Activity className="w-6 h-6 text-signal-info mb-12 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">PEAK PROCESSING</div>
                            <div className="text-[40px] font-black text-white leading-none mb-1">{stats?.peakProcessing || '---'}</div>
                            <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase">REQUESTS / SEC</div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-8 flex flex-col justify-between hover:border-signal-block/30 transition-colors group">
                        <ShieldAlert className="w-6 h-6 text-signal-block mb-12 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">THREATS MITIGATED</div>
                            <div className="text-[40px] font-black text-white leading-none mb-1">{stats?.threatsMitigated || '---'}</div>
                            <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase">ACTIVE FILTERS</div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-8 flex flex-col justify-between hover:border-white/20 transition-colors group">
                        <Network className="w-6 h-6 text-white mb-12 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">GLOBAL NODES</div>
                            <div className="text-[40px] font-black text-white leading-none mb-1">{stats?.globalNodes || '---'}</div>
                            <div className="text-[10px] font-bold tracking-widest text-white/30 uppercase">OPERATIONAL HUBS</div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-white/30">
                    <div className="flex items-center space-x-3">
                        <span className="text-white/50">STATUS: NOMINAL</span>
                        <div className="w-2 h-2 rounded-full bg-signal-info shadow-[0_0_10px_rgba(0,200,255,0.8)]" />
                    </div>
                    <div className="flex items-center space-x-8">
                        <span className="flex items-center space-x-2"><Activity className="w-3 h-3" /> <span>CONSOLE</span></span>
                        <span className="flex items-center space-x-2"><Network className="w-3 h-3" /> <span>LOGS</span></span>
                        <span className="text-white/10">|</span>
                        <span>© 2026 NEXUS INFRASTRUCTURE</span>
                    </div>
                </div>
            </div>

            {/* Right Slanted System Health Panel */}
            <div className="w-full xl:w-[350px] shrink-0 h-[850px]">
                <SlantedPanel variant="blue" className="w-[105%] -ml-[5%] pl-[5%]">
                    <div className="flex flex-col h-full text-white pt-12 pr-4 pl-4">
                        <h2 className="text-[48px] font-black italic uppercase leading-[0.9] tracking-tighter mb-16 shadow-[0_4px_10px_rgba(0,0,0,0.1)] drop-shadow-md">
                            SYSTEM<br />HEALTH
                        </h2>

                        <div className="flex flex-col space-y-12 flex-1">
                            {/* Health Stat 1 */}
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2">CORE_ENGINE</div>
                                <div className="text-3xl font-black tracking-widest uppercase mb-4">{stats?.coreEngine || 'OFFLINE'}</div>
                                <div className="h-1.5 w-full bg-black/20 overflow-hidden">
                                    <div className="h-full bg-white w-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                </div>
                            </div>

                            {/* Health Stat 2 */}
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2">DATABASE_LATENCY</div>
                                <div className="text-3xl font-black mb-4">{stats?.dbLatency || '--'}<span className="text-[16px] italic ml-1">ms</span></div>
                                <div className="h-1.5 w-full bg-black/20 overflow-hidden">
                                    <div className="h-full bg-white w-[15%]" />
                                </div>
                            </div>

                            {/* Health Stat 3 */}
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2">MEMORY_LOAD</div>
                                <div className="text-3xl font-black mb-4">{stats?.memoryLoad || '--'}<span className="text-[16px] italic ml-1">GB</span></div>
                                <div className="h-1.5 w-full bg-black/20 overflow-hidden">
                                    <div className="h-full bg-white w-[75%]" />
                                </div>
                            </div>
                        </div>

                        <PillButton variant="secondary" className="w-full mt-auto mb-12 h-16 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                            RUN DIAGNOSTICS ⚙
                        </PillButton>
                    </div>
                </SlantedPanel>
            </div>

        </div>
    );
}
