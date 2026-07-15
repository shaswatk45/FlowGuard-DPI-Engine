import React, { useState } from 'react';
import { Shield, Play, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';
import { cn } from '../utils/cn';

interface RuleMatchResult {
    matched: boolean;
    ruleName: string;
    action: 'FORWARD' | 'DROP';
    details: string;
}

export function RulePlayground() {
    const [payload, setPayload] = useState('www.youtube.com');
    const [isTesting, setIsTesting] = useState(false);
    const [result, setResult] = useState<RuleMatchResult | null>(null);

    const testRule = () => {
        setIsTesting(true);
        setResult(null);
        
        setTimeout(() => {
            const input = payload.trim().toLowerCase();
            let match: RuleMatchResult = {
                matched: false,
                ruleName: 'None',
                action: 'FORWARD',
                details: 'No active rules matches this traffic. Packet forwarded safely.'
            };

            if (input.includes('youtube') || input.includes('facebook') || input.includes('instagram') || input.includes('tiktok')) {
                match = {
                    matched: true,
                    ruleName: 'BLOCK SOCIAL MEDIA / VIDEO STREAMING',
                    action: 'DROP',
                    details: 'Triggered by domain matching rule. Layer-7 block applied.'
                };
            } else if (input.includes('c2.malware') || input.includes('malware') || input.includes('c2.server')) {
                match = {
                    matched: true,
                    ruleName: 'BLOCK MALWARE C2 COMMUNICATIONS',
                    action: 'DROP',
                    details: 'Matched high-severity C2 signature. Host quarantine recommended.'
                };
            } else if (input.includes('torrent') || input.includes('p2p') || input.includes('tracker')) {
                match = {
                    matched: true,
                    ruleName: 'RATE LIMIT TORRENT CLIENTS',
                    action: 'DROP',
                    details: 'Throttled BitTorrent packet. Multi-session limits active.'
                };
            } else if (input.includes('192.168.1.50') || input.includes('10.0.0.150')) {
                match = {
                    matched: true,
                    ruleName: 'BLOCK SUSPICIOUS IP ADDR',
                    action: 'DROP',
                    details: 'Source IP blacklisted on firewall core node.'
                };
            }

            setResult(match);
            setIsTesting(false);
        }, 1200);
    };

    return (
        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 flex flex-col">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">
                DPI Rule Playground
            </div>
            <div className="text-sm font-bold text-white/60 mb-6">
                Test custom packet payload signatures against active rules
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form area */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                            Packet Payload (SNI Domain, Source IP, or App String)
                        </label>
                        <input
                            type="text"
                            value={payload}
                            onChange={e => setPayload(e.target.value)}
                            placeholder="e.g. www.facebook.com"
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                    </div>
                    <button
                        onClick={testRule}
                        disabled={isTesting || !payload.trim()}
                        className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest text-black bg-accent-blue hover:bg-accent-blue-hover transition-colors flex items-center justify-center gap-2"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isTesting ? 'Parsing Signatures...' : 'Test Payload Match'}
                    </button>
                </div>

                {/* Response area */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-center min-h-[140px]">
                    {isTesting ? (
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">DPI Rule Engine Parsing...</span>
                        </div>
                    ) : result ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-white/50" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">RESULT STATE</span>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    result.action === 'DROP' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                )}>
                                    {result.action}PED
                                </span>
                            </div>

                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Triggered Rule:</div>
                                <div className="text-xs font-bold text-white font-mono">{result.ruleName}</div>
                            </div>

                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">DPI Diagnostics:</div>
                                <div className="text-[12px] text-white/60 leading-relaxed font-medium">{result.details}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-30 py-4">
                            <Terminal className="w-8 h-8 mx-auto mb-2 text-white" />
                            <p className="text-xs font-bold uppercase tracking-widest">Awaiting payload string entry</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
