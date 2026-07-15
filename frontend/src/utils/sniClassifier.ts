// SNI / Domain risk classifier
// Assigns a risk category and color to a domain based on its app type and hostname patterns

export type RiskCategory = 'streaming' | 'social' | 'cdn' | 'security' | 'suspicious' | 'productivity' | 'gaming' | 'unknown';

interface RiskInfo {
    label: string;
    color: string;
    bg: string;
}

export const RISK_META: Record<RiskCategory, RiskInfo> = {
    streaming:   { label: 'STREAMING',    color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
    social:      { label: 'SOCIAL',       color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
    cdn:         { label: 'CDN',          color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    security:    { label: 'SECURITY',     color: '#00c8ff', bg: 'rgba(0,200,255,0.15)' },
    suspicious:  { label: 'SUSPICIOUS',   color: '#ff4d4f', bg: 'rgba(255,77,79,0.2)' },
    productivity:{ label: 'PRODUCTIVITY', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    gaming:      { label: 'GAMING',       color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
    unknown:     { label: 'UNKNOWN',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const STREAMING_APPS  = ['YouTube', 'Netflix', 'Spotify', 'TikTok', 'Twitch', 'Disney', 'Hulu', 'Prime'];
const SOCIAL_APPS     = ['Facebook', 'Instagram', 'Twitter', 'Twitter/X', 'WhatsApp', 'Telegram', 'Discord', 'Snapchat', 'LinkedIn', 'Reddit'];
const CDN_APPS        = ['Cloudflare', 'Akamai', 'Fastly', 'CDN', 'Google', 'Amazon', 'Microsoft', 'Apple'];
const SECURITY_APPS   = ['HTTPS', 'TLS', 'DNS', 'VPN'];
const PRODUCTIVITY_APPS = ['Zoom', 'Slack', 'GitHub', 'Google', 'Microsoft', 'Dropbox', 'OneDrive'];
const GAMING_APPS     = ['Steam', 'Epic', 'Xbox', 'PlayStation', 'Riot', 'Valve', 'Battle.net'];

const SUSPICIOUS_PATTERNS = [
    /\.onion$/i, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, /c2\./i, /malware/i,
    /phish/i, /botnet/i, /payload/i, /exploit/i, /\.xyz$/i, /\.tk$/i,
];

export function classifyDomain(domain: string, appType: string): RiskCategory {
    // Suspicious check first
    if (SUSPICIOUS_PATTERNS.some(p => p.test(domain) || p.test(appType))) return 'suspicious';
    if (STREAMING_APPS.some(a => appType.toLowerCase().includes(a.toLowerCase()))) return 'streaming';
    if (SOCIAL_APPS.some(a => appType.toLowerCase().includes(a.toLowerCase()))) return 'social';
    if (GAMING_APPS.some(a => appType.toLowerCase().includes(a.toLowerCase()) || domain.toLowerCase().includes(a.toLowerCase()))) return 'gaming';
    if (PRODUCTIVITY_APPS.some(a => appType.toLowerCase().includes(a.toLowerCase()))) return 'productivity';
    if (CDN_APPS.some(a => appType.toLowerCase().includes(a.toLowerCase()))) return 'cdn';
    if (SECURITY_APPS.some(a => appType.toUpperCase() === a)) return 'security';
    if (!appType || appType === 'Unknown') return 'unknown';
    return 'unknown';
}

export function getRiskInfo(category: RiskCategory): RiskInfo {
    return RISK_META[category] ?? RISK_META.unknown;
}
