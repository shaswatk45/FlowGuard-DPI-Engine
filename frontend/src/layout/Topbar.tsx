import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Keyboard } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import { EngineStatusWidget } from '../components/EngineStatusWidget';

export function Topbar() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const tabs = [
        { name: 'HOME',      path: '/upload' },
        { name: 'RULES',     path: '/rules' },
        { name: 'ANALYTICS', path: '/dashboard' },
        { name: 'HISTORY',   path: '/history' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-[90px] bg-page z-50 flex items-center px-10 md:px-16 border-b border-border-default">
            <Link to="/upload" className="flex items-center space-x-4 mr-12 hover:opacity-85 transition-opacity">
                <div className="w-12 h-12 rounded-[16px] bg-white flex items-center justify-center shadow-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 6v6.5C3 18.04 6.89 23 12 23c5.11 0 9-4.96 9-10.5V6l-9-4z" fill="#000" />
                        <path d="M12 11.5L7 16l-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="text-[22px] font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    FLOWGUARD
                </span>
            </Link>

            <nav className="flex h-full space-x-8">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className={cn(
                                "relative flex items-center h-full text-[12px] font-black tracking-widest transition-colors uppercase",
                                isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                            )}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {tab.name}
                            {isActive && (
                                <div className="absolute bottom-[28px] left-0 right-0 h-[2px] bg-accent-blue rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <EngineStatusWidget />

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-border-default flex items-center justify-center hover:bg-white/10 transition-colors"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-white/70" /> : <Moon className="w-4 h-4 text-gray-700" />}
                </button>
                <button
                    className="w-10 h-10 rounded-xl bg-white/5 border border-border-default flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="Keyboard shortcuts (?)"
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
                >
                    <Keyboard className="w-4 h-4 text-white/70" />
                </button>
            </div>
        </header>
    );
}
