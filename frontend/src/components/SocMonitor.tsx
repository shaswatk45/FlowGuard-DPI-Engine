import { useState } from 'react';
import { Settings, ShieldAlert, FileOutput, Server, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/cn';

interface ActiveRulesProp {
    rules: { title: string; severity?: string; flag?: string; enabled: boolean }[];
}

export function SocMonitor({ rules = [] }: ActiveRulesProp) {
    const [syslogIp, setSyslogIp] = useState('10.240.0.8');
    const [syslogPort, setSyslogPort] = useState('514');
    const [syslogStatus, setSyslogStatus] = useState<'connected' | 'disconnected'>('connected');
    const { addToast } = useToast();

    const exportSnortRules = () => {
        const active = rules.filter(r => r.enabled);
        if (active.length === 0) {
            addToast('No active rules to export', 'warn');
            return;
        }

        const ruleLines = active.map((r, i) => {
            const proto = r.flag?.includes('domain') ? 'udp' : 'tcp';
            const signature = r.flag || 'any';
            return `alert ${proto} any any -> any any (msg:"FlowGuard DPI Block: ${r.title}"; content:"${signature}"; sid:${1000000 + i}; rev:1;)`;
        }).join('\n');

        const blob = new Blob([ruleLines], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowguard-snort-${Date.now()}.rules`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Snort rules exported successfully', 'success');
    };

    return (
        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 flex flex-col">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">
                Enterprise SIEM & SOC Integration
            </div>
            <div className="text-sm font-bold text-white/60 mb-6">
                Syslog streaming status and signature conversion exports
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Suricata/Snort Export */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-accent-blue">
                            <ShieldAlert className="w-4.5 h-4.5" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white">IDS Signature Export</h4>
                        </div>
                        <p className="text-[12px] text-white/50 leading-relaxed mb-4">
                            Convert active Layer-7 FlowGuard rules directly into Snort-compliant signatures to deploy on external network intrusion detection sensors.
                        </p>
                    </div>
                    <button
                        onClick={exportSnortRules}
                        className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        <FileOutput className="w-4 h-4" /> Export Snort Rules
                    </button>
                </div>

                {/* 2. Syslog Configuration */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-accent-blue">
                            <Settings className="w-4.5 h-4.5" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white">RFC 5424 Syslog Ingest</h4>
                        </div>
                        <p className="text-[12px] text-white/50 leading-relaxed mb-3">
                            Stream packet telemetry and drop records directly to your security information center (Splunk / Elastic SIEM).
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                                type="text"
                                value={syslogIp}
                                onChange={e => setSyslogIp(e.target.value)}
                                className="h-9 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white font-mono"
                            />
                            <input
                                type="text"
                                value={syslogPort}
                                onChange={e => setSyslogPort(e.target.value)}
                                className="h-9 bg-black/40 border border-white/10 rounded-lg px-2 text-[11px] text-white font-mono"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSyslogStatus(syslogStatus === 'connected' ? 'disconnected' : 'connected');
                            addToast(syslogStatus === 'connected' ? 'Syslog forwarder disabled' : 'Syslog streaming linked', 'info');
                        }}
                        className={cn(
                            "w-full h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border",
                            syslogStatus === 'connected' 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        )}
                    >
                        {syslogStatus === 'connected' ? (
                            <>
                                <Check className="w-3.5 h-3.5" /> Streaming Active
                            </>
                        ) : (
                            'Link Syslog Ingest'
                        )}
                    </button>
                </div>

                {/* 3. Core Engine Telemetry */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-accent-blue">
                            <Server className="w-4.5 h-4.5" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-white">Engine Performance</h4>
                        </div>
                        <div className="flex flex-col gap-2 font-mono text-[10px] text-white/50">
                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span>Core CPU Load:</span>
                                <span className="text-emerald-400 font-bold">1.4%</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span>Memory Heap:</span>
                                <span className="text-white/80">34.2 MB</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                <span>Mean Latency:</span>
                                <span className="text-emerald-400 font-bold">1.2 µs</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Active Rules:</span>
                                <span className="text-white/80">{rules.length} configurations</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] text-white/30 text-center select-none pt-2">
                        Status: <span className="text-emerald-400 font-bold">ONLINE</span> · Uptime: 4h 12m
                    </div>
                </div>
            </div>
        </div>
    );
}
