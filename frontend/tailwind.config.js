/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                page: 'var(--bg-page)',
                sidebar: 'var(--bg-sidebar)',
                card: 'var(--bg-card)',
                'card-alt': 'var(--bg-card-alt)',
                'border-default': 'var(--border-default)',
                'border-hover': 'var(--border-hover)',
                'border-focus': 'var(--border-focus)',
                'signal-allow': 'var(--signal-allow)',
                'signal-block': 'var(--signal-block)',
                'signal-warn': 'var(--signal-warn)',
                'signal-info': 'var(--signal-info)',
                'signal-purple': 'var(--signal-purple)',
                'signal-disabled': 'var(--signal-disabled)',
                'accent-blue': 'var(--accent-blue)',
                'accent-blue-hover': 'var(--accent-blue-hover)',
            },
            backgroundImage: {
                'gradient-hero': 'var(--gradient-hero)',
                'gradient-cta': 'var(--gradient-cta)',
            },
            fontFamily: {
                sans: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            fontSize: {
                'hero-numeral': ['120px', { lineHeight: '0.9', fontWeight: '800' }], // Made larger for 99.9% UPTIME
                'section-title': ['64px', { lineHeight: '1.0', fontWeight: '800' }], // Enormous section titles
                'metric-value': ['48px', { lineHeight: '1', fontWeight: '700' }],
                'card-title': ['18px', { lineHeight: '1.2', fontWeight: '700' }],
                'body': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
                'table-data': ['13px', { lineHeight: '1.5' }],
                'identifier-label': ['10px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '700' }],
                'status-tag': ['10px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '700' }],
            },
            spacing: {
                'base': '8px',
                'card': '32px',
                'section': '80px',
            },
            borderRadius: {
                'card': '24px',
                'hero': '32px',
                'tag': '8px',
            }
        },
    },
    plugins: [],
}
 
 
 
