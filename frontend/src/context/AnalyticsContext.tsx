import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface AppStat {
    app: string;
    count: number;
    percentage: number;
}

export interface SNIEntry {
    domain: string;
    appType: string;
}

export interface AnalyticsData {
    totalPackets: number;
    tcpPackets:   number;
    udpPackets:   number;
    totalBytes:   number;
    forwarded:    number;
    dropped:      number;
    appBreakdown: AppStat[];
    detectedSNIs: SNIEntry[];
    ruleHits?:    Record<string, number>;
    filename:     string;
    timestamp:    string;
}

interface AnalyticsContextValue {
    analytics:    AnalyticsData | null;
    setAnalytics: (data: AnalyticsData | null) => void;
    isLoading:    boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
    analytics:    null,
    setAnalytics: () => {},
    isLoading:    true
});

export function AnalyticsProvider({ children }: { children: ReactNode }) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await fetch('/api/latest-analysis');
                if (res.ok) {
                    const data = await res.json();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Failed to fetch latest analysis status:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLatest();
    }, []);

    return (
        <AnalyticsContext.Provider value={{ analytics, setAnalytics, isLoading }}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export const useAnalytics = () => useContext(AnalyticsContext);

 
