import { useEffect, useRef, useState } from 'react';

interface TickerEvent {
    id: string;
    type: 'BLOCKED' | 'DROPPED' | 'SNI' | 'RULE' | 'ALERT';
    message: string;
    color: string;
}

interface ThreatTickerProps {
    events: TickerEvent[];
}

function genEvents(analytics: any): TickerEvent[] {
    if (!analytics) return [];
    const events: TickerEvent[] = [];

    if (analytics.dropped > 0) {
        events.push({ id: 'drop', type: 'DROPPED', message: `${analytics.dropped} packets dropped in last analysis`, color: '#ff4d4f' });
    }
    analytics.detectedSNIs?.slice(0, 8).forEach((sni: any, i: number) => {
        events.push({ id: `sni-${i}`, type: 'SNI', message: `SNI detected: ${sni.domain} → ${sni.appType}`, color: '#00c8ff' });
    });
    analytics.appBreakdown?.slice(0, 5).forEach((app: any, i: number) => {
        events.push({ id: `app-${i}`, type: 'ALERT', message: `${app.app} traffic: ${app.count} packets (${app.percentage.toFixed(1)}%)`, color: '#a78bfa' });
    });
    if (analytics.totalPackets > 0) {
        events.push({ id: 'total', type: 'RULE', message: `DPI Engine processed ${analytics.totalPackets.toLocaleString()} packets from ${analytics.filename}`, color: '#34d399' });
    }
    return events.length > 0 ? events : [{ id: 'idle', type: 'ALERT', message: 'FlowGuard DPI Engine — Awaiting traffic analysis', color: '#4B8DFF' }];
}

export function ThreatTicker() {
    const [events, setEvents] = useState<TickerEvent[]>([{ id: 'idle', type: 'ALERT', message: 'FlowGuard DPI Engine — Awaiting traffic analysis', color: '#4B8DFF' }]);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/latest-analysis');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(genEvents(data));
                }
            } catch { /* ignore */ }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Duplicate for seamless loop
    const items = [...events, ...events];

    return (
        <div className="w-full overflow-hidden border-b border-t border-white/[0.04] bg-black/30 h-[34px] flex items-center relative">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, #050505 0%, transparent 100%)' }} />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(270deg, #050505 0%, transparent 100%)' }} />

            <div ref={trackRef} className="flex items-center gap-0 animate-ticker whitespace-nowrap will-change-transform">
                {items.map((evt, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-6">
                        <span
                            className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded"
                            style={{ color: evt.color, backgroundColor: `${evt.color}18` }}
                        >
                            {evt.type}
                        </span>
                        <span className="text-[10px] font-mono text-white/50">{evt.message}</span>
                        <span className="text-white/10 mx-2">◆</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
