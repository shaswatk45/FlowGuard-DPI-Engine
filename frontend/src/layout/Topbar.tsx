import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';

export function Topbar() {
    const location = useLocation();

    // Mapping old paths to new Nexus V2 nomenclature
    const tabs = [
        { name: 'HOME', path: '/upload' },
        { name: 'RULES', path: '/rules' },
        { name: 'ANALYTICS', path: '/dashboard' },
        { name: 'NODES', path: '/traffic' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-[90px] bg-page z-50 flex items-center px-10 md:px-16 border-b border-transparent">
            {/* Logo Area */}
            <Link to="/upload" className="flex items-center space-x-4 mr-16 hover:opacity-85 transition-opacity">
                <div className="w-12 h-12 rounded-[16px] bg-white flex items-center justify-center shadow-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 6v6.5C3 18.04 6.89 23 12 23c5.11 0 9-4.96 9-10.5V6l-9-4z" fill="#000" />
                        <path d="M12 11.5L7 16l-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="text-white text-[22px] font-black tracking-tighter">
                    NEXUS.V2
                </span>
            </Link>

            {/* Navigation */}
            <nav className="flex h-full space-x-10">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className={cn(
                                "relative flex items-center h-full text-[13px] font-black tracking-widest transition-colors uppercase",
                                isActive ? "text-white" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            {tab.name}
                            {isActive && (
                                <div className="absolute bottom-[28px] left-0 right-0 h-[2px] bg-white rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Right Side Search & User */}
            <div className="ml-auto flex items-center space-x-6">
                <input
                    type="text"
                    placeholder="SEARCH POLICY"
                    className="w-[280px] h-[44px] bg-[#111111] border border-white/5 rounded-full px-6 text-[11px] font-black tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                />

                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-2 ring-white/10">
                    {/* Mock Avatar */}
                    <div className="w-full h-full bg-[#E5E7EB] relative flex items-end justify-center">
                        <div className="w-4 h-4 bg-[#FCD34D] rounded-full absolute top-1.5 z-10"></div>
                        <div className="w-8 h-8 bg-blue-500 rounded-t-full relative z-0"></div>
                    </div>
                </div>
            </div>
        </header>
    );
}
