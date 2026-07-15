import React, { useState } from 'react';
import { Database, FileSearch, AlertTriangle, Cpu, ArrowRight, ArrowLeft, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';

interface PipelineStage {
    id: number;
    title: string;
    icon: React.ReactNode;
    subtitle: string;
}

const STAGES: PipelineStage[] = [
    { id: 0, title: 'PCAP INGEST', icon: <Database className="w-5 h-5" />, subtitle: 'Raw Capture Demuxing' },
    { id: 1, title: 'L7 DECODE', icon: <FileSearch className="w-5 h-5" />, subtitle: 'Deep Packet Inspection' },
    { id: 2, title: 'THREAT FILTER', icon: <AlertTriangle className="w-5 h-5" />, subtitle: 'Signature Matching & Action' },
    { id: 3, title: 'DATA CONSOL', icon: <Cpu className="w-5 h-5" />, subtitle: 'Dashboard Graph Ingest' }
];

const PathLine = ({ left, top, width, horizontal, active, children }: any) => (
    <div className={cn(
        "absolute overflow-hidden transition-colors duration-700",
        horizontal ? "-translate-y-1/2" : "-translate-x-1/2",
        active ? "bg-white/30 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-white/5"
    )} style={{ left, top, width: horizontal ? width : 2, height: horizontal ? 2 : width }}>
        {children}
    </div>
);

export function PipelineBreakdown() {
    const [currentStage, setCurrentStage] = useState(0);

    const getTransform = () => {
        let scale = 1;
        let x = 0;
        let y = 120; // Default center Y within the track
        switch (currentStage) {
            case 0: scale = 1.35; x = 70; y = 120; break;
            case 1: scale = 1.45; x = 310; y = 120; break;
            case 2: scale = 1.25; x = 550; y = 160; break; // Center lower to include dropped bin
            case 3: scale = 1.35; x = 790; y = 120; break;
        }
        const tx = `calc(50% - ${x * scale}px)`;
        const ty = `calc(150px - ${y * scale}px)`; // 150px is half of the 300px viewport
        return `translate(${tx}, ${ty}) scale(${scale})`;
    };

    return (
        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 flex flex-col relative overflow-hidden">
            <style>{`
                @keyframes movePacket {
                    0% { left: 0%; opacity: 0; transform: translate(-50%, -50%); }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; opacity: 0; transform: translate(-50%, -50%); }
                }
                .packet {
                    position: absolute;
                    top: 50%;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: movePacket 1.5s linear infinite;
                }
                .packet-blue { background-color: #00c8ff; box-shadow: 0 0 12px #00c8ff; animation-delay: 0s; }
                .packet-purple { background-color: #a855f7; box-shadow: 0 0 12px #a855f7; animation-delay: 0.5s; }
                .packet-red { background-color: #ef4444; box-shadow: 0 0 12px #ef4444; animation-delay: 1s; }

                @keyframes dropPacket {
                    0% { top: 0%; opacity: 0; transform: translate(-50%, -50%); }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; transform: translate(-50%, -50%); }
                }
                .packet-drop-anim {
                    position: absolute;
                    left: 50%;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #ef4444;
                    box-shadow: 0 0 12px #ef4444;
                    animation: dropPacket 1.5s linear infinite;
                    animation-delay: 1s;
                }

                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spin-slow { animation: spin-slow 10s linear infinite; }

                @keyframes scan-beam {
                    0% { transform: translateY(-15px); opacity: 0; }
                    10% { opacity: 1; }
                    50% { transform: translateY(15px); opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-15px); opacity: 0; }
                }
                .scan-beam { animation: scan-beam 2s ease-in-out infinite; }

                @keyframes binary-scroll {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .binary-scroll { animation: binary-scroll 3s linear infinite; }

                @keyframes pulse-ring {
                    0% { transform: scale(0.7); opacity: 0.5; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                
                @keyframes pan-bg {
                    from { background-position: 0 0; }
                    to { background-position: 40px 40px; }
                }
                .bg-pan { animation: pan-bg 2s linear infinite; }
            `}</style>

            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 z-10 relative">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">
                        DPI Pipeline breakdown
                    </div>
                    <div className="text-sm font-bold text-white/60">
                        Interactive Under-The-Hood Processing Animation
                    </div>
                </div>

                {/* Micro Steps Tracker */}
                <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 border border-white/5">
                    {STAGES.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStage(i)}
                            className={cn(
                                "w-6 h-6 rounded-lg text-[9px] font-black transition-all flex items-center justify-center",
                                currentStage === i ? "bg-accent-blue text-white" : "text-white/30 hover:bg-white/10"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interactive Viewport */}
            <div className="relative h-[300px] bg-[#030303]/80 border border-white/10 rounded-2xl overflow-hidden flex items-center mb-8">
                
                {/* Red alert threat strobe effect for Stage 2 */}
                {currentStage === 2 && (
                    <div className="absolute inset-0 bg-red-500/[0.03] animate-pulse pointer-events-none z-0" />
                )}

                {/* Animated Pipeline Track (The Camera Canvas) */}
                <div 
                    className="absolute left-0 top-0 w-[860px] h-[350px] transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform z-10"
                    style={{ transform: getTransform(), transformOrigin: 'left top' }}
                >
                    {/* Node 0: Ingest */}
                    <div className={cn("absolute left-0 top-[50px] w-[140px] h-[140px] rounded-full border-2 flex flex-col items-center justify-center bg-[#050505] transition-all duration-700 z-10", currentStage === 0 ? "border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)] scale-110" : "border-white/10")} >
                        <div className={cn("absolute inset-2 rounded-full border border-dashed transition-colors", currentStage === 0 ? "border-blue-500/50 spin-slow" : "border-white/10")} />
                        <Database className={cn("w-6 h-6 mb-2 z-10 transition-colors", currentStage === 0 ? "text-blue-400" : "text-white/30")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest z-10 transition-colors", currentStage === 0 ? "text-white" : "text-white/50")}>Ingest</span>
                        {currentStage === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full opacity-30 pointer-events-none">
                                <div className="font-mono text-[10px] text-blue-400 leading-none whitespace-pre binary-scroll flex flex-col gap-1 tracking-widest">
                                    {`01101001\n10010110\n11100011\n00101010\n01101001\n10010110\n11100011\n00101010`}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Path 0-1 */}
                    <PathLine left={140} top={120} width={100} horizontal active={currentStage === 0}>
                        <div className="packet packet-blue" />
                        <div className="packet packet-purple" />
                        <div className="packet packet-red" />
                    </PathLine>

                    {/* Node 1: Decode */}
                    <div className={cn("absolute left-[240px] top-[50px] w-[140px] h-[140px] rounded-full border-2 flex flex-col items-center justify-center bg-[#050505] transition-all duration-700 z-10", currentStage === 1 ? "border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] scale-110" : "border-white/10")} >
                        <div className={cn("absolute inset-2 rounded-full border border-dashed transition-colors", currentStage === 1 ? "border-purple-500/50 spin-slow" : "border-white/10")} />
                        <FileSearch className={cn("w-6 h-6 mb-2 z-10 transition-colors", currentStage === 1 ? "text-purple-400" : "text-white/30")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest z-10 transition-colors", currentStage === 1 ? "text-white" : "text-white/50")}>L7 Decode</span>
                        {currentStage === 1 && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none">
                                <div className="w-16 h-0.5 bg-purple-400 shadow-[0_0_15px_#a855f7] scan-beam" />
                            </div>
                        )}
                    </div>

                    {/* Path 1-2 */}
                    <PathLine left={380} top={120} width={100} horizontal active={currentStage === 1}>
                        <div className="packet packet-blue" />
                        <div className="packet packet-purple" />
                        <div className="packet packet-red" />
                    </PathLine>

                    {/* Node 2: Threat Filter */}
                    <div className={cn("absolute left-[480px] top-[50px] w-[140px] h-[140px] rounded-full border-2 flex flex-col items-center justify-center bg-[#050505] transition-all duration-700 z-10", currentStage === 2 ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] scale-110" : "border-white/10")} >
                        <div className={cn("absolute inset-2 rounded-full border border-dashed transition-colors", currentStage === 2 ? "border-red-500/50 spin-slow" : "border-white/10")} />
                        <Shield className={cn("w-6 h-6 mb-2 z-10 transition-colors", currentStage === 2 ? "text-red-400" : "text-white/30")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest z-10 transition-colors text-center", currentStage === 2 ? "text-white" : "text-white/50")}>Threat<br/>Filter</span>
                        {currentStage === 2 && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none">
                                <div className="absolute w-[120px] h-[120px] border-2 border-red-500/50 rounded-full pulse-ring" />
                            </div>
                        )}
                    </div>

                    {/* Path 2-3 (Only safe packets) */}
                    <PathLine left={620} top={120} width={100} horizontal active={currentStage >= 2}>
                        <div className="packet packet-blue" />
                        <div className="packet packet-purple" />
                    </PathLine>

                    {/* Path 2-Drop (Only threat packet) */}
                    <PathLine left={550} top={190} width={60} horizontal={false} active={currentStage === 2}>
                        <div className="packet-drop-anim" />
                    </PathLine>

                    {/* Dropped Bin */}
                    <div className={cn("absolute left-[500px] top-[250px] w-[100px] h-[50px] border rounded-lg flex flex-col items-center justify-center transition-all duration-700 z-10 bg-[#050505]", currentStage === 2 ? "border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]" : "border-white/10")}>
                        <ShieldAlert className={cn("w-4 h-4 mb-0.5", currentStage === 2 ? "text-red-500 animate-pulse" : "text-white/30")} />
                        <span className={cn("text-[7px] font-black uppercase tracking-widest", currentStage === 2 ? "text-red-400" : "text-white/40")}>Dropped</span>
                    </div>

                    {/* Node 3: Data Consolidation */}
                    <div className={cn("absolute left-[720px] top-[50px] w-[140px] h-[140px] rounded-full border-2 flex flex-col items-center justify-center bg-[#050505] transition-all duration-700 z-10", currentStage === 3 ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-110" : "border-white/10")} >
                        <div className={cn("absolute inset-2 rounded-full border border-dashed transition-colors", currentStage === 3 ? "border-emerald-500/50 spin-slow" : "border-white/10")} />
                        <Cpu className={cn("w-6 h-6 mb-2 z-10 transition-colors", currentStage === 3 ? "text-emerald-400" : "text-white/30")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest z-10 transition-colors text-center leading-tight", currentStage === 3 ? "text-white" : "text-white/50")}>Data<br/>Consol</span>
                        {currentStage === 3 && (
                            <div className="absolute bottom-5 flex items-end gap-1.5 opacity-60 z-0">
                                <div className="w-2 bg-emerald-400 animate-[bounce_1s_infinite]" style={{ height: '12px', animationDelay: '0s' }} />
                                <div className="w-2 bg-emerald-400 animate-[bounce_1s_infinite]" style={{ height: '24px', animationDelay: '0.2s' }} />
                                <div className="w-2 bg-emerald-400 animate-[bounce_1s_infinite]" style={{ height: '18px', animationDelay: '0.4s' }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Explanation Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
                {/* Previous stage */}
                <button
                    onClick={() => setCurrentStage(prev => Math.max(0, prev - 1))}
                    disabled={currentStage === 0}
                    className="h-12 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous Stage
                </button>

                {/* Stage Info */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center flex flex-col justify-center min-h-[110px]">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                        {STAGES[currentStage].icon}
                        {STAGES[currentStage].title} — {STAGES[currentStage].subtitle}
                    </h4>
                    <p className="text-[11px] text-white/50 font-medium leading-relaxed">
                        {currentStage === 0 && 'The C++ FlowGuard engine ingests binary PCAP capture streams. It buffers packets sequentially and unpacks physical and transport header bytes to demultiplex TCP/UDP layer segments.'}
                        {currentStage === 1 && 'Layer-7 Deep Packet Inspection decodes application data. Instead of raw port matching, FlowGuard scans the TLS Client Hello payloads to extract the Server Name Indication (SNI) string prior to handshake completion.'}
                        {currentStage === 2 && 'This is the filtering checkpoint. Unblocked traffic is forwarded instantly. When malware C2 beaconing, DDoS flood syns, or P2P torrent sequences trigger active rules, they are flagged and shunted at edge node speeds.'}
                        {currentStage === 3 && 'Consolidated drops, protocol distributions, and categorized threat metrics are aggregated into JSON maps. FlowGuard dynamically feeds these stats into the UI dashboard graphs.'}
                    </p>
                </div>

                {/* Next stage */}
                <button
                    onClick={() => setCurrentStage(prev => Math.min(STAGES.length - 1, prev + 1))}
                    disabled={currentStage === STAGES.length - 1}
                    className="h-12 rounded-xl bg-accent-blue hover:bg-accent-blue-hover text-black font-black transition-colors disabled:opacity-20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                    Next Stage <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Premium Red alert warning boxes (scary part for companies, how we fix it) */}
            {currentStage === 2 && (
                <div className="mt-6 p-5 rounded-xl border border-red-500/30 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15)_0%,transparent_100%)] bg-[#050505] animate-slide-up flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)] z-10">
                    {/* Animated diagonal scanlines for the alert box */}
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ef4444_10px,#ef4444_20px)] bg-pan pointer-events-none" />
                    
                    <div className="flex items-center gap-3 text-red-500 shrink-0 z-10 relative">
                        <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 animate-pulse">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-[14px] font-black uppercase tracking-widest text-red-400">CRITICAL EXPOSURE</div>
                            <div className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest">Port 443 Subversion</div>
                        </div>
                    </div>
                    
                    <div className="w-px h-12 bg-red-500/20 hidden md:block z-10 relative" />
                    
                    <div className="text-[11px] text-white/70 font-medium leading-relaxed flex-1 z-10 relative">
                        <span className="text-red-400 font-bold">The Threat:</span> Modern malware and C2 exfiltration schemes encrypt their payloads and masquerade on standard HTTP/TLS ports, rendering traditional enterprise firewalls completely blind.
                        <br />
                        <span className="text-emerald-400 font-bold mt-1 inline-block">The FlowGuard Fix:</span> Our DPI engine intercepts the TLS handshake in sub-microseconds, parsing exact SNIs to instantly decapitate malicious flows before they reach your core network.
                    </div>
                </div>
            )}
        </div>
    );
}

