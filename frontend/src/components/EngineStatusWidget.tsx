import { useEffect, useState } from 'react';
import { Activity, Wifi } from 'lucide-react';
import { cn } from '../utils/cn';

interface EngineStatus {
    online: boolean;
    message: string;
    lastAnalysis: {
        filename: string;
        totalPackets: number;
        dropped: number;
        timestamp: string;
    } | null;
}

export function EngineStatusWidget() {
    const [status, setStatus] = useState<EngineStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/engine-status');
                if (res.ok) setStatus(await res.json());
            } catch {
                setStatus({ online: false, message: 'Offline', lastAnalysis: null });
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    if (!status) return null;

    return (
        <div className="hidden lg:flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className={cn(
                    'w-2 h-2 rounded-full',
                    status.online ? 'bg-signal-allow animate-pulse' : 'bg-signal-block'
                )} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    {status.online ? 'Engine Online' : 'Engine Offline'}
                </span>
            </div>
            {status.lastAnalysis && (
                <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                    <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        {status.lastAnalysis.totalPackets.toLocaleString()} pkts
                    </span>
                    <span className="text-white/20">|</span>
                    <span className={status.lastAnalysis.dropped > 0 ? 'text-signal-block' : 'text-signal-allow'}>
                        {status.lastAnalysis.dropped} dropped
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <Activity className="w-3 h-3 shrink-0" />
                        {status.lastAnalysis.filename}
                    </span>
                </div>
            )}
        </div>
    );
}
