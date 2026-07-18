import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Skull, RefreshCw, XCircle, ArrowRight, Activity, Database, Radio, Compass } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface AttackStatus {
    active: boolean;
    type: string | null;
    pps: number;
    ip: string | null;
    mitigated: boolean;
    mitigationMethod: string | null;
}

export function AttackAlertOverlay() {
    const [attack, setAttack] = useState<AttackStatus>({
        active: false,
        type: null,
        pps: 0,
        ip: null,
        mitigated: false,
        mitigationMethod: null
    });
    
    const [simPps, setSimPps] = useState(0);
    const { addToast } = useToast();

    // Poll the attack status API every 1.2 seconds
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/attack-status');
                if (res.ok) {
                    const data = await res.json();
                    setAttack(data);
                }
            } catch (err) {
                // Ignore API connection issues
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 1200);
        return () => clearInterval(interval);
    }, []);

    // Get customized content for each attack type
    const getAttackDetails = (type: string | null) => {
        switch (type) {
            case 'ddos':
                return {
                    title: 'DDoS SYN Flood Attack',
                    icon: <Activity className="w-8 h-8" />,
                    desc: 'Critical volume of synthetic TCP SYN connection packets detected.',
                    metricLabel: 'Traffic Rate',
                    metricSuffix: 'pps',
                    baseVal: 1245800,
                    severity: 'CRITICAL',
                    severityColor: 'text-red-500 border-red-500/20 bg-red-500/5',
                    recs: [
                        { id: 'rate-limit', label: 'Rate-Limit Target Ports (80/443)', desc: 'Throttle traffic above 10k pps.' },
                        { id: 'block-ip', label: 'Blacklist Attack Source IP', desc: 'Null-route all traffic from 192.168.1.50.' }
                    ],
                    flowSteps: {
                        raw: ['Attacker (1.2M pps)', 'Edge Router', 'Backend Server'],
                        mitigated: ['Attacker (1.2M pps)', 'Null Route / Dropped', 'Backend (0 pps allowed)']
                    }
                };
            case 'sql':
                return {
                    title: 'SQL Injection Threat',
                    icon: <Database className="w-8 h-8" />,
                    desc: 'Database exploitation payload detected in login API request query string.',
                    metricLabel: 'Exploit Attempts',
                    metricSuffix: 'attempts/sec',
                    baseVal: 24,
                    severity: 'HIGH',
                    severityColor: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
                    recs: [
                        { id: 'rate-limit', label: 'Enable WAF SQLi Filters', desc: 'Deploy query string regex rules.' },
                        { id: 'block-ip', label: 'Block Malicious Client IP', desc: 'Null-route database requests from attacker.' }
                    ],
                    flowSteps: {
                        raw: ['SQLi Payload', 'Web Server', 'Vulnerable Database'],
                        mitigated: ['SQLi Payload', 'WAF Signature Block', 'Protected Database']
                    }
                };
            case 'scan':
                return {
                    title: 'Port Scan Reconnaissance',
                    icon: <Compass className="w-8 h-8" />,
                    desc: 'Host detected sending rapid TCP SYN probes across ports 1-1024.',
                    metricLabel: 'Probing Rate',
                    metricSuffix: 'probes/sec',
                    baseVal: 25400,
                    severity: 'MEDIUM',
                    severityColor: 'text-purple-500 border-purple-500/20 bg-purple-500/5',
                    recs: [
                        { id: 'block-ip', label: 'Auto-Block IP in iptables', desc: 'Block host on discovery.' },
                        { id: 'rate-limit', label: 'Enable TCP SYN Cookies', desc: 'Handle probes statelessly.' }
                    ],
                    flowSteps: {
                        raw: ['Scan Probes', 'Handshake', 'Open Ports List'],
                        mitigated: ['Scan Probes', 'iptables Drop Target', 'Ports Stealth Mode']
                    }
                };
            case 'c2':
                return {
                    title: 'Malware C2 Beaconing',
                    icon: <Radio className="w-8 h-8" />,
                    desc: 'Heartbeat signal identified from local workstation to a known C2 host.',
                    metricLabel: 'Beacon Period',
                    metricSuffix: 'seconds',
                    baseVal: 15,
                    severity: 'HIGH',
                    severityColor: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
                    recs: [
                        { id: 'block-ip', label: 'Sinkhole Domain in DNS', desc: 'Redirect c2.malware.test queries.' },
                        { id: 'rate-limit', label: 'Isolate Host Workstation', desc: 'Quarantine machine to VLAN.' }
                    ],
                    flowSteps: {
                        raw: ['Infected PC', 'DNS Query', 'Malicious C2 Link'],
                        mitigated: ['Infected PC', 'DNS Sinkhole (127.0.0.1)', 'C2 Server Blocked']
                    }
                };
            default:
                return {
                    title: 'Network Anomaly Detected',
                    icon: <Activity className="w-8 h-8" />,
                    desc: 'Abnormal traffic payload signature match.',
                    metricLabel: 'Anomaly Score',
                    metricSuffix: '% confidence',
                    baseVal: 98,
                    severity: 'LOW',
                    severityColor: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
                    recs: [
                        { id: 'block-ip', label: 'Null Route Source Host', desc: 'Block source router interface.' }
                    ],
                    flowSteps: {
                        raw: ['Anomaly Source', 'IPS Detector', 'Security Alert'],
                        mitigated: ['Anomaly Source', 'Firewall Bypass', 'Alert Cleared']
                    }
                };
        }
    };

    const details = getAttackDetails(attack.type);

    // Simulate fluctuating packet rates during active attack
    useEffect(() => {
        if (attack.active && !attack.mitigated && details) {
            setSimPps(details.baseVal + Math.floor((Math.random() - 0.5) * (details.baseVal * 0.1)));
            const timer = setInterval(() => {
                setSimPps(details.baseVal + Math.floor((Math.random() - 0.5) * (details.baseVal * 0.1)));
            }, 350);
            return () => clearInterval(timer);
        } else {
            setSimPps(0);
        }
    }, [attack.active, attack.mitigated, attack.type, details]);

    const handleMitigate = async (method: string) => {
        try {
            const res = await fetch('/api/attack/mitigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method })
            });
            if (res.ok) {
                const data = await res.json();
                setAttack(data.attack);
                addToast(`Attack mitigated using: ${method.toUpperCase()}`, 'success');
            }
        } catch (err) {
            addToast('Mitigation failed', 'error');
        }
    };

    const handleDismiss = async () => {
        try {
            const res = await fetch('/api/attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false })
            });
            if (res.ok) {
                const data = await res.json();
                setAttack(data.attack);
                addToast('Alert logs archived.', 'info');
            }
        } catch (err) {
            addToast('Dismiss failed', 'error');
        }
    };

    if (!attack.active || !details) return null;

    // Flow steps
    const flowSteps = attack.mitigated ? details.flowSteps.mitigated : details.flowSteps.raw;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            {/* Pulsing warning glow */}
            <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
                attack.mitigated 
                    ? 'bg-emerald-500/[0.02] shadow-[inset_0_0_100px_rgba(16,185,129,0.08)]' 
                    : 'bg-red-500/[0.04] shadow-[inset_0_0_100px_rgba(239,68,68,0.12)] alarm-flash'
            }`} />

            <div className={`relative w-full max-w-xl bg-[#07070b]/95 border rounded-[30px] p-8 shadow-2xl flex flex-col transition-all ${
                attack.mitigated ? 'border-emerald-500/30' : 'border-red-500/40 shadow-red-500/5'
            }`}>
                
                {/* Header Info */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                        attack.mitigated 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                    }`}>
                        {attack.mitigated ? <ShieldCheck className="w-6 h-6" /> : details.icon}
                    </div>
                    <div className="text-left">
                        <h2 className={`text-xl font-black uppercase tracking-wide font-mono ${
                            attack.mitigated ? 'text-emerald-400' : 'text-red-500'
                        }`}>
                            {attack.mitigated ? '🛡️ Threat Mitigated' : details.title}
                        </h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                            IDS Telemetry Alert: {attack.ip}
                        </p>
                    </div>
                    <div className={`ml-auto px-2.5 py-1 rounded-full border text-[9px] font-black font-mono tracking-wider ${
                        attack.mitigated 
                            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
                            : details.severityColor
                    }`}>
                        {attack.mitigated ? 'SAFE' : details.severity}
                    </div>
                </div>

                {/* Description */}
                <p className="text-left text-white/70 text-sm leading-relaxed mb-6">
                    {attack.mitigated 
                        ? `The threat has been neutralized by applying ${attack.mitigationMethod?.toUpperCase()} filters.`
                        : details.desc
                    }
                </p>

                {/* Live Mitigated Flow Graph */}
                <div className="text-left mb-6">
                    <div className="text-[9px] text-white/30 uppercase tracking-wider font-mono mb-3">
                        Active Ingestion Flow Network:
                    </div>
                    
                    <div className="flex items-center gap-2 w-full p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        {flowSteps.map((step, idx) => (
                            <div key={idx} className="flex items-center flex-1 last:flex-none">
                                <div className={`px-3 py-2 rounded-xl border text-[10px] font-mono text-center font-bold w-full truncate ${
                                    attack.mitigated
                                        ? (idx === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold' : 'bg-white/5 border-white/10 text-white/50')
                                        : (idx === 1 ? 'bg-red-500/10 border-red-500/30 text-red-400 font-extrabold' : 'bg-white/5 border-white/10 text-white/50')
                                }`}>
                                    {step}
                                </div>
                                {idx < flowSteps.length - 1 && (
                                    <div className="px-1 shrink-0 flex items-center justify-center">
                                        <ArrowRight className={`w-3.5 h-3.5 ${attack.mitigated ? 'text-emerald-500/40' : 'text-red-500/40'}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metrics */}
                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 text-left font-mono">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="opacity-40 block text-[9px] uppercase tracking-wider">Attack Vector</span>
                            <span className="text-white font-bold uppercase">{attack.type} Probe</span>
                        </div>
                        <div>
                            <span className="opacity-40 block text-[9px] uppercase tracking-wider">Attacker IP</span>
                            <span className="text-white font-bold">{attack.ip}</span>
                        </div>
                        <div className="col-span-2 border-t border-white/5 pt-3">
                            <span className="opacity-40 block text-[9px] uppercase tracking-wider">{details.metricLabel}</span>
                            <span className={`text-lg font-black tracking-wider ${attack.mitigated ? 'text-emerald-400' : 'text-red-500'}`}>
                                {attack.mitigated ? '0 ' + details.metricSuffix : `${simPps.toLocaleString()} ${details.metricSuffix}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Countermeasures / Action Buttons */}
                {!attack.mitigated ? (
                    <div className="w-full flex flex-col gap-3">
                        <div className="text-[9px] text-white/30 uppercase tracking-wider font-mono text-left">
                            Recommended Mitigation Options:
                        </div>
                        
                        {details.recs.map((rec, i) => (
                            <button
                                key={rec.id}
                                onClick={() => handleMitigate(rec.id)}
                                className={`w-full h-14 rounded-2xl text-left px-5 flex items-center justify-between border transition-all ${
                                    i === 1 
                                        ? 'bg-red-500 hover:bg-red-600 text-black border-red-600' 
                                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                }`}
                            >
                                <div className="text-left">
                                    <div className="text-[11px] font-black uppercase tracking-wider">{rec.label}</div>
                                    <div className={`text-[9px] mt-0.5 ${i === 1 ? 'text-black/60' : 'text-white/40'}`}>{rec.desc}</div>
                                </div>
                                {i === 1 ? <Skull className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="w-full">
                        <button
                            onClick={handleDismiss}
                            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-4.5 h-4.5" />
                            Dismiss Alert and Resume Safe State
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes alarm-pulse {
                    0% { opacity: 0.1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 0.1; }
                }
                .alarm-flash {
                    animation: alarm-pulse 1.2s infinite;
                }
            `}</style>
        </div>
    );
}
