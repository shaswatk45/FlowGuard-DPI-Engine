import { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

export type ThreatState = 'nominal' | 'elevated' | 'high' | 'critical';

interface GradientHeroCardProps {
    threatState: ThreatState;
    packetsPerSec: string;
    engineId: string;
}

export function GradientHeroCard({ threatState, packetsPerSec, engineId }: GradientHeroCardProps) {
    const [timestamp, setTimestamp] = useState('');

    useEffect(() => {
        const updateTime = () => setTimestamp(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const protocols = ['TCP', 'TLS', 'DNS', 'HTTP', 'SMTP', 'UDP'];

    const threatStyles = {
        nominal: 'opacity-40',
        elevated: 'opacity-60',
        high: 'opacity-80',
        critical: 'opacity-100 animate-pulse',
    };

    return (
        <div className="relative w-full h-[280px] rounded-hero overflow-hidden group shadow-lg">
            {/* Background Gradient Layer */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-hero transition-opacity duration-1000 ease-in-out",
                    threatStyles[threatState]
                )}
            />
            {/* Fallback dark background so gradient acts as overlay */}
            <div className="absolute inset-0 bg-card/40 backdrop-blur-sm -z-10" />

            <div className="relative h-full flex flex-col justify-between p-8 z-10">

                {/* Top Section */}
                <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                        <span className="text-identifier-label text-white/70 mb-2">PACKETS / SEC</span>
                        <span className="text-hero-numeral text-[#F5F5F5]">{packetsPerSec}</span>
                    </div>

                    <div className="flex flex-col items-end text-right">
                        <span className="text-identifier-label text-white/70 mb-1">ENGINE ID</span>
                        <span className="font-mono text-table-data font-bold text-white mb-4">{engineId}</span>
                        <span className="text-identifier-label text-white/70 mb-1">SYSTEM TIME</span>
                        <span className="font-mono text-table-data text-white">{timestamp}</span>
                        <div className="mt-4 flex items-center space-x-2">
                            <div className={cn("w-2 h-2 rounded-full", threatState === 'nominal' ? 'bg-signal-allow' : threatState === 'elevated' ? 'bg-signal-warn' : 'bg-signal-block')} />
                            <span className="text-status-tag text-white uppercase tracking-widest">{threatState}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Strip */}
                <div className="flex items-center space-x-3 pt-6 border-t border-white/10">
                    <span className="text-identifier-label text-white/50">ACTIVE PROTOCOLS:</span>
                    <div className="flex space-x-2 text-table-data font-mono text-white/90">
                        {protocols.map((p, i) => (
                            <span key={p} className="flex items-center">
                                {i > 0 && <span className="mx-2 text-white/30 truncate">·</span>}
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
