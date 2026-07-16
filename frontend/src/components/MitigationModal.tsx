import { useState, useEffect, useRef } from 'react';
import { Shield, X, Server, Wifi, CheckCircle, Cpu, Network, FileCode, Play, AlertCircle, Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';

export type ThreatType = 'ddos' | 'malware' | 'torrent' | 'intrusion' | 'none';

interface MitigationModalProps {
    open: boolean;
    threatType: ThreatType;
    targetInfo: string;
    onClose: () => void;
    onMitigationComplete: (newRuleFlag?: string, newRuleTitle?: string) => void;
}

type TabType = 'topology' | 'comparison' | 'playbook';

export function MitigationModal({ open, threatType, targetInfo, onClose, onMitigationComplete }: MitigationModalProps) {
    const [step, setStep] = useState<'intro' | 'animating' | 'success'>('intro');
    const [activeTab, setActiveTab] = useState<TabType>('topology');
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [packetsFiltered, setPacketsFiltered] = useState(0);
    const [copied, setCopied] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const animIntervalRef = useRef<any>(null);

    useEffect(() => {
        if (open) {
            setStep('intro');
            setActiveTab('topology');
            setLogs([]);
            setProgress(0);
            setPacketsFiltered(0);
            setCopied(false);
        }
    }, [open]);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        return () => {
            if (animIntervalRef.current) {
                clearInterval(animIntervalRef.current);
            }
        };
    }, []);

    const getThreatDetails = () => {
        switch (threatType) {
            case 'ddos':
                return {
                    title: 'DDoS SYN Flood / IP Flood',
                    desc: 'High-frequency packet flood causing buffer saturation and drops.',
                    countermeasure: 'Deploy SYN cookies, write dynamic IP rate-limiters, and route traffic through FlowScrub cluster.',
                    successMsg: 'SYN flood mitigated. Dynamic firewall rule deployed.',
                    playbook: `# BGP Flowspec & Edge Rule Playbook (DDoS Countermeasures)
# 1. BGP Flowspec route diversion config (Juniper/Cisco)
flowspec {
    route REDIRECT-TO-SCRUBBING {
        match {
            destination 192.168.1.0/24;
            protocol tcp;
            tcp-flags syn;
            destination-port 80 443;
        }
        then {
            community redirect:65000:999; # Redirect to Scrubbing Center
            rate-limit 50000;             # Restrict flow rate
        }
    }
}

# 2. Edge firewall IPtables protection rule
iptables -A INPUT -p tcp --syn -m limit --limit 50/s --limit-burst 100 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP
sysctl -w net.ipv4.tcp_syncookies=1
sysctl -w net.ipv4.tcp_max_syn_backlog=2048`,
                    comparison: {
                        metric: 'Ingress Volume',
                        before: '28.4 Gbps',
                        after: '120 Kbps',
                        cpuBefore: '94%',
                        cpuAfter: '5%',
                        latencyBefore: '1,450ms',
                        latencyAfter: '14ms'
                    }
                };
            case 'malware':
                return {
                    title: 'Malware Command & Control (C2)',
                    desc: 'Beaconing detected to known malicious C2 servers.',
                    countermeasure: 'Isolate compromised host, inject DNS sinkhole rules, and drop outbound TLS connections to target host.',
                    successMsg: 'C2 connections blocked. Domain blacklisted.',
                    playbook: `# Host Isolation & Domain Sinkhole Playbook (Malware Containment)
# 1. CoreDNS/Bind9 Sinkhole Injection Rule
zone "${targetInfo || 'c2.malware.test'}" {
    type master;
    file "/etc/bind/zones/blocked-sinkhole.db";
};

# blocked-sinkhole.db zone file mapping:
# *   IN  A   0.0.0.0   ; Redirect malware requests to blackhole

# 2. Enterprise Switch Port Isolation ACL (Cisco IOS)
ip access-list extended ISOLATE-HOST-ACL
 deny ip host 192.168.1.100 any
 permit ip any any
interface GigabitEthernet1/0/24
 ip access-group ISOLATE-HOST-ACL in`,
                    comparison: {
                        metric: 'Exfiltration Rate',
                        before: '15.2 Mbps',
                        after: '0 bps (Blocked)',
                        cpuBefore: '22%',
                        cpuAfter: '2%',
                        latencyBefore: '45ms',
                        latencyAfter: '12ms'
                    }
                };
            case 'torrent':
                return {
                    title: 'P2P Torrent Bandwidth Abuse',
                    desc: 'High-session BitTorrent activity consuming global system bandwidth.',
                    countermeasure: 'Apply Layer-7 deep packet throttling, limit sessions per host, and prioritize critical business protocols (QoS).',
                    successMsg: 'Bandwidth throttled. Priority QoS queue optimized.',
                    playbook: `# Layer-7 QoS Traffic Control Playbook (P2P Throttling)
# 1. Linux tc (Traffic Control) QoS queue rate limit
# Root HTB scheduler
tc qdisc add dev eth0 root handle 1: htb default 10

# Limit peer-to-peer traffic class to 50Kbps
tc class add dev eth0 parent 1: classid 1:20 htb rate 50kbit ceil 100kbit
# Match BitTorrent protocol (requires iproute2-pf / Layer-7 modules)
tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 6881 0xffff flowid 1:20
tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip sport 6881 0xffff flowid 1:20`,
                    comparison: {
                        metric: 'P2P Bandwidth',
                        before: '92 Mbps',
                        after: '400 Kbps (Throttled)',
                        cpuBefore: '88%',
                        cpuAfter: '12%',
                        latencyBefore: '120ms',
                        latencyAfter: '15ms'
                    }
                };
            default:
                return {
                    title: 'Intrusion / Network Port Scan',
                    desc: 'Rapid sequence of connection attempts targeting closed system ports.',
                    countermeasure: 'Write dynamic block rule for scan sources, route scanner traffic to HoneyPot target, and close diagnostic ports.',
                    successMsg: 'Host blacklisted. HoneyPot redirection active.',
                    playbook: `# Network Security Intrusion Blocking & Honeypot Playbook
# 1. Iptables Port Scan Blacklisting
iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -m limit --limit 1/s --limit-burst 2 -j ACCEPT
iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -j DROP

# 2. Blackhole routing for intruder IP
ip route add blackhole ${targetInfo || '192.168.1.50'}

# 3. Honeypot diversion (Port 80 to Honeypot port 8080)
iptables -t nat -A PREROUTING -s ${targetInfo || '192.168.1.50'} -p tcp --dport 80 -j REDIRECT --to-ports 8080`,
                    comparison: {
                        metric: 'Scanner Connections',
                        before: '550 pps',
                        after: '0 pps (Blackholed)',
                        cpuBefore: '45%',
                        cpuAfter: '2%',
                        latencyBefore: '85ms',
                        latencyAfter: '12ms'
                    }
                };
        }
    };

    const runMitigation = () => {
        setStep('animating');
        setLogs(['[SYSTEM] Initializing Incident Response Center...', '[SYSTEM] Locking configuration states...']);
        
        let currentProgress = 0;
        let counter = 0;

        const details = getThreatDetails();
        const threatLogs = {
            ddos: [
                '[FIREWALL] Generating temporary rules for packet scrubbing...',
                '[FIREWALL] Inspecting TCP handshake states...',
                '[FLOWSCRUB] Active traffic diversion requested. Routing to scrubbing center...',
                '[SCRUB-1] Scrubbing node online. Analyzing SYN sequence numbers...',
                '[FIREWALL] Enabling SYN cookies mechanism...',
                '[FIREWALL] Dynamic rate-limit activated on host: ' + targetInfo,
                '[SYSTEM] Restoring normal load balance state...'
            ],
            malware: [
                '[SEC-ENGINE] Locating infected client hostname...',
                '[SEC-ENGINE] Host isolated: ' + targetInfo,
                '[DNS-SH] Injecting DNS sinkhole rewrite for malicious domain...',
                '[FIREWALL] Injecting rule: DROP tcp from any to host matching C2 signature...',
                '[SYSTEM] Flushing system DNS caches...',
                '[MONITOR] Verifying quarantine state of isolated host...'
            ],
            torrent: [
                '[QOS] Initiating session limit controls...',
                '[QOS] Capping max TCP connections per user to 50...',
                '[FIREWALL] Registering Layer-7 DPI filter for bittorrent protocol...',
                '[SHAPER] Throttling ports 6881-6889 bandwidth to 50KB/s...',
                '[SYSTEM] Routing remaining bandwidth back to priority VoIP/Web queues...',
                '[SYSTEM] QoS rule application confirmed.'
            ],
            intrusion: [
                '[IDS] Logged suspicious ports probing activity...',
                '[FIREWALL] Creating blackhole route for source IP: ' + targetInfo,
                '[HONEYPOT] Establishing fake service listening on target ports...',
                '[HONEYPOT] Diverting all scanner payload traffic to telemetry logger...',
                '[FIREWALL] Reject rule applied: REJECT all matching tcp flag SYN from scanner...',
                '[SYSTEM] Ports isolated. Telemetry active.'
            ]
        };

        const activeLogs = (threatLogs as any)[threatType] || [];

        animIntervalRef.current = setInterval(() => {
            currentProgress += 4;
            setProgress(currentProgress);
            
            if (threatType === 'ddos') {
                setPacketsFiltered(prev => prev + Math.floor(Math.random() * 85) + 30);
            } else if (threatType === 'torrent') {
                setPacketsFiltered(prev => prev + Math.floor(Math.random() * 15) + 5);
            }

            if (currentProgress % 15 === 0 && counter < activeLogs.length) {
                setLogs(prev => [...prev, activeLogs[counter]]);
                counter++;
            }

            if (currentProgress >= 100) {
                clearInterval(animIntervalRef.current);
                setStep('success');
                setLogs(prev => [...prev, '[SUCCESS] ' + details.successMsg, '[SYSTEM] Protected state finalized. Uptime normalized.']);
            }
        }, 100);
    };

    const handleConfirm = () => {
        let flag = '';
        let title = '';
        if (threatType === 'ddos') {
            flag = `--rate-limit ddos`;
            title = 'DYNAMIC DDOS SCRUBBING';
        } else if (threatType === 'malware') {
            flag = `--block-domain ${targetInfo || 'c2.malware.test'}`;
            title = `BLOCK MALWARE C2 (${targetInfo || 'c2.malware.test'})`;
        } else if (threatType === 'torrent') {
            flag = `--rate-limit torrent`;
            title = 'RATE LIMIT TORRENT CLIENTS';
        } else {
            flag = `--block-ip ${targetInfo || '192.168.1.50'}`;
            title = `BLOCK INTRUDER IP (${targetInfo || '192.168.1.50'})`;
        }

        onMitigationComplete(flag, title);
    };

    const copyPlaybook = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!open) return null;
    const details = getThreatDetails();

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={step === 'animating' ? undefined : onClose} />

            <div className="relative w-full max-w-3xl bg-[#080808] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-slide-up">
                {/* Visual Top Neon Bar */}
                <div className="h-[2px] w-full bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500" />

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">FlowGuard Shield</span>
                                <h3 className="text-xl font-black uppercase text-white tracking-tight">Active Defensive Countermeasure</h3>
                            </div>
                        </div>
                        {step !== 'animating' && (
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        )}
                    </div>

                    {/* Step Navigation Tabs */}
                    <div className="flex border-b border-white/5 mb-6">
                        <button
                            onClick={() => setActiveTab('topology')}
                            className={cn(
                                "pb-3 px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors",
                                activeTab === 'topology' ? "border-accent-blue text-white" : "border-transparent text-white/30 hover:text-white/60"
                            )}
                        >
                            <span className="flex items-center gap-2"><Network className="w-3.5 h-3.5" /> Network Topology</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('comparison')}
                            className={cn(
                                "pb-3 px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors",
                                activeTab === 'comparison' ? "border-accent-blue text-white" : "border-transparent text-white/30 hover:text-white/60"
                            )}
                        >
                            <span className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5" /> Impact Analytics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('playbook')}
                            className={cn(
                                "pb-3 px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors",
                                activeTab === 'playbook' ? "border-accent-blue text-white" : "border-transparent text-white/30 hover:text-white/60"
                            )}
                        >
                            <span className="flex items-center gap-2"><FileCode className="w-3.5 h-3.5" /> Enterprise Playbook</span>
                        </button>
                    </div>

                    {/* Tab 1: Interactive Network Topology Map */}
                    {activeTab === 'topology' && (
                        <div className="flex flex-col gap-6">
                            {/* Graphic Visualizer */}
                            <div className="relative h-56 bg-black border border-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                                {/* Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:20px_20px]" />
                                
                                <div className="flex items-center gap-4 z-10 w-full px-12 justify-between">
                                    {/* WAN Node */}
                                    <div className="flex flex-col items-center gap-2 w-24">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                                            step === 'animating' ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white/60"
                                        )}>
                                            <Wifi className="w-6 h-6" />
                                        </div>
                                        <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">WAN Inbound</span>
                                    </div>

                                    {/* Ingress Link */}
                                    <div className="flex-1 relative flex items-center justify-center">
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                                            {step === 'animating' ? (
                                                <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full w-full animate-pulse" />
                                            ) : step === 'success' ? (
                                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-full" />
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Firewall Node */}
                                    <div className="flex flex-col items-center gap-2 w-28 relative">
                                        {step === 'success' && (
                                            <div className="absolute -top-3 w-16 h-16 rounded-full border-2 border-emerald-500/40 bg-emerald-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                                        )}
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center border z-10 transition-all",
                                            step === 'animating' 
                                                ? "bg-orange-500/10 border-orange-500/30 text-orange-500" 
                                                : step === 'success' 
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                                                    : "bg-white/5 border-white/10 text-white/70"
                                        )}>
                                            <Shield className="w-7 h-7" />
                                        </div>
                                        <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">Enterprise FW</span>
                                    </div>

                                    {/* Egress Link */}
                                    <div className="flex-1 relative flex items-center justify-center">
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                                            {step === 'animating' ? (
                                                <div className="h-full bg-red-500 rounded-full w-1/4 animate-bounce" />
                                            ) : step === 'success' ? (
                                                <div className="h-full bg-emerald-500 rounded-full w-full" />
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Corporate LAN Node */}
                                    <div className="flex flex-col items-center gap-2 w-24">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                                            step === 'animating' 
                                                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                                : step === 'success' 
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                                    : "bg-white/5 border-white/10 text-white/50"
                                        )}>
                                            <Server className="w-6 h-6" />
                                        </div>
                                        <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">VLAN Corporate</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-3 left-6 right-6 flex justify-between text-[10px] font-mono text-white/30 z-10">
                                    <span>Target payload: {targetInfo || 'Default Gateway'}</span>
                                    {packetsFiltered > 0 && (
                                        <span className="text-red-400 font-bold">Filtered Packets: {packetsFiltered.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {step === 'intro' && (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-2 text-red-500">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-wider">{details.title} Active</span>
                                        </div>
                                        <p className="text-[13px] text-white/60 font-medium leading-relaxed">{details.desc}</p>
                                    </div>
                                    <button
                                        onClick={runMitigation}
                                        className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-black bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(239,68,68,0.2)]"
                                    >
                                        <Play className="w-4 h-4" /> Deploy Active Defense
                                    </button>
                                </div>
                            )}

                            {step === 'animating' && (
                                <div className="flex flex-col gap-4">
                                    {/* Progress bar */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/60">
                                            <span>Configuring Active Shield Filters...</span>
                                            <span className="font-mono text-emerald-400">{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-100 ease-out"
                                                style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    {/* Terminal output */}
                                    <div className="h-28 bg-black border border-white/10 rounded-xl p-4 font-mono text-[11px] overflow-y-auto leading-relaxed flex flex-col gap-1 text-white/60 select-none">
                                        {logs.map((log, i) => (
                                            <div key={i} className={cn(
                                                log.startsWith('[SUCCESS]') && 'text-emerald-400 font-bold',
                                                log.startsWith('[FIREWALL]') && 'text-amber-400',
                                                log.startsWith('[SYSTEM]') && 'text-white/40'
                                            )}>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logEndRef} />
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">Defense Engaged Successfully</h4>
                                        <p className="text-[12px] text-white/50 max-w-md mx-auto">
                                            Telemetry normalized. Outbound malware channels blocked and system uptime restored.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleConfirm}
                                        className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-black bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-[0_8px_24px_rgba(16,185,129,0.2)] mt-2"
                                    >
                                        Apply Config & Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Before vs After Telemetry Comparison */}
                    {activeTab === 'comparison' && (
                        <div className="flex flex-col gap-6">
                            <div className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-1">
                                Core Network Impact Metrics (Simulation)
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Before Card */}
                                <div className="bg-red-500/[0.02] border border-red-500/20 rounded-2xl p-5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500/80 mb-3 block">
                                        ATTACK IN PROGRESS (BEFORE)
                                    </span>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/40 text-[12px]">{details.comparison.metric}:</span>
                                            <span className="text-red-400 font-black text-[13px]">{details.comparison.before}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/40 text-[12px]">Core CPU Overhead:</span>
                                            <span className="text-red-400 font-black text-[13px]">{details.comparison.cpuBefore}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40 text-[12px]">Average Latency:</span>
                                            <span className="text-red-400 font-black text-[13px]">{details.comparison.latencyBefore}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* After Card */}
                                <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3 block">
                                        SHIELD DEFENSE APPLIED (AFTER)
                                    </span>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/40 text-[12px]">{details.comparison.metric}:</span>
                                            <span className="text-emerald-400 font-black text-[13px]">{details.comparison.after}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2">
                                            <span className="text-white/40 text-[12px]">Core CPU Overhead:</span>
                                            <span className="text-emerald-400 font-black text-[13px]">{details.comparison.cpuAfter}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/40 text-[12px]">Average Latency:</span>
                                            <span className="text-emerald-400 font-black text-[13px]">{details.comparison.latencyAfter}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-[12px] text-white/50 leading-relaxed font-medium">
                                <strong>Enterprise Impact Analysis:</strong> Active defense countermeasures deploy a dynamic scrubbing profile on your upstream core routers, instantly mitigating target saturation. Local core CPU overhead drops to minimal levels, preserving normal network QoS for corporate subnets.
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Enterprise Playbook Configurations */}
                    {activeTab === 'playbook' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                    Edge Router & Firewall configuration code (CLI)
                                </span>
                                <button
                                    onClick={() => copyPlaybook(details.playbook)}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1.5"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy Configuration
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="relative">
                                <pre className="h-64 bg-black border border-white/10 rounded-2xl p-5 font-mono text-[11px] overflow-y-auto text-emerald-400/90 leading-relaxed select-all">
                                    {details.playbook}
                                </pre>
                            </div>
                            <div className="text-[11px] text-white/30 font-medium">
                                * Configuration templates are parameterized for host scopes. Verify ACL masks prior to edge deployment.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
