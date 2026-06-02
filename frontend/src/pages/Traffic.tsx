import { useState, useEffect } from 'react';
import { FlowTable, type FlowRecord } from '../components/FlowTable';
import { SlantedPanel } from '../components/SlantedPanel';
import { PageHeader } from '../components/PageHeader';
import { Pause, ChevronLeft, ChevronRight } from 'lucide-react';

export function Traffic() {
    const [flows, setFlows] = useState<FlowRecord[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const fetchFlows = async () => {
            if (isPaused) return;
            try {
                const res = await fetch('/api/traffic-stream');
                const data = await res.json();

                // Prepend new flows and keep only the latest 50 to prevent memory leak
                setFlows(prev => {
                    const combined = [...data, ...prev];
                    return combined.slice(0, 50);
                });
            } catch (err) {
                console.error("Failed to fetch traffic stream:", err);
            }
        };

        fetchFlows();
        interval = setInterval(fetchFlows, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    return (
        <div className="flex flex-col xl:flex-row gap-12 w-full mt-4">
            {/* Left Quick Filters Sidebar */}
            <div className="w-full xl:w-[320px] shrink-0 h-[800px]">
                <SlantedPanel variant="blue" className="w-[105%] -ml-[5%]">
                    <div className="flex flex-col h-full text-white pt-8 px-2">
                        <h2 className="text-[44px] font-black italic uppercase leading-[0.9] tracking-tighter mb-10">
                            QUICK<br />FILTERS
                        </h2>

                        <div className="flex flex-col space-y-4 mb-16">
                            {['TLS_TRAFFIC', 'MALWARE_DET', 'UDP_FLOOD', 'GEO_BLOCK'].map((filter, i) => (
                                <button key={i} className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-4 px-6 flex justify-between items-center text-[12px] font-black tracking-widest uppercase border border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
                                    {filter}
                                    <ChevronRight className="w-4 h-4 opacity-50" />
                                </button>
                            ))}
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-8">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white mb-3">BANDWIDTH</div>
                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[65%]" />
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white mb-3">CPU LOAD</div>
                                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[30%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </SlantedPanel>
            </div>

            {/* Right Main Interface */}
            <div className="flex-1 flex flex-col pt-8">
                <div className="flex items-end justify-between border-b border-white/5 pb-8 mb-8 relative">
                    <PageHeader
                        titleTop="PACKET"
                        titleBottom="STREAM"
                        className="mb-0 !mt-[-20px]"
                    />
                    <div className="absolute bottom-6 flex items-center space-x-6 text-[11px] font-bold tracking-[0.2em] font-mono">
                        <span className="text-accent-blue">LIVE</span>
                        <span className="text-white/20">|</span>
                        <span className="text-white/40">INTERFACE: ETH0_NORTH</span>
                    </div>
                </div>

                <div className="flex-[1] overflow-hidden flex flex-col">
                    <FlowTable data={flows} />

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between mt-8">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className={`flex items-center space-x-3 text-white px-8 py-3 rounded-[12px] font-black text-[12px] tracking-widest transition-colors ${isPaused ? 'bg-signal-block hover:bg-signal-block/80 shadow-[0_0_20px_rgba(255,77,79,0.3)]' : 'bg-accent-blue hover:bg-accent-blue-hover shadow-[0_0_20px_rgba(43,140,238,0.3)]'
                                    }`}
                            >
                                <Pause className="w-4 h-4 fill-white" />
                                <span>{isPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}</span>
                            </button>
                            <button className="flex items-center space-x-3 bg-black border border-white/10 hover:border-white/30 text-white px-8 py-3 rounded-[12px] font-black text-[12px] tracking-widest transition-colors">
                                <span>EXPORT PCAP</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-8">
                            <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">
                                SHOWING 2,491 PACKETS / SEC
                            </span>
                            <div className="flex space-x-2">
                                <button className="w-10 h-10 border border-white/5 bg-[#0a0a0a] rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
                                    <ChevronLeft className="w-4 h-4 text-white/50" />
                                </button>
                                <button className="w-10 h-10 border border-white/10 bg-[#111111] rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <ChevronRight className="w-4 h-4 text-white/80" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom System Status Line */}
                <div className="mt-16 border-t border-white/5 pt-8 flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-white/30">
                    <div className="flex items-center space-x-6">
                        <span>NEXUS_V2.0 //</span>
                        <span>TRAFFIC_ANALYSIS_MODULE // CORE:</span>
                        <span>0X9F2A</span>
                    </div>
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-signal-allow"></div>
                            <span>LATENCY: 0.2MS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                            <span>LOAD: 12%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
 
