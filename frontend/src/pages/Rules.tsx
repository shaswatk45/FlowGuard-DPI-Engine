import { useState, useEffect } from 'react';
import { RuleCard, type NexusRule } from '../components/RuleCard';
import { SlantedPanel } from '../components/SlantedPanel';
import { PageHeader } from '../components/PageHeader';

export function Rules() {
    const [rules, setRules] = useState<NexusRule[]>([]);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await fetch('/api/rules');
                const data = await res.json();
                setRules(data);
            } catch (err) {
                console.error("Failed to fetch rules:", err);
            }
        };
        fetchRules();
    }, []);

    const handleToggle = async (id: string, enabled: boolean) => {
        // Optimistic UI update
        const previousRules = [...rules];
        setRules(rules.map(r => r.id === id ? { ...r, enabled } : r));

        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled })
            });
            const data = await res.json();
            if (data.success && data.rules) {
                setRules(data.rules); // Sync with actual server state
            } else {
                setRules(previousRules); // Revert on soft failure
            }
        } catch (err) {
            console.error("Failed to update rule:", err);
            setRules(previousRules); // Revert on hard failure
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-16 w-full mt-4">
            {/* Left Side: Rules List */}
            <div className="flex-1 flex flex-col">
                <div className="relative">
                    <PageHeader
                        titleTop="RULE"
                        titleBottom="ENGINE"
                        subtitle="Expressive, high-performance deep packet inspection. Designed for absolute control and visual clarity."
                    />

                    {/* Node/Network Indicators (from design image) */}
                    <div className="absolute right-12 bottom-0 flex items-center -space-x-2 drop-shadow-md">
                        <div className="w-9 h-9 rounded-full bg-[#00f298] flex items-center justify-center text-[10px] font-black tracking-tighter text-black z-10 border-2 border-page">
                            124
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#4B8DFF] flex items-center justify-center text-[10px] font-black tracking-tighter text-white z-0 border-2 border-page">
                            82k
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-6 mt-8">
                    {rules.map((rule) => (
                        <RuleCard
                            key={rule.id}
                            rule={rule}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            </div>

            {/* Right Side: Add Rule Panel */}
            <div className="w-full xl:w-[400px] flex flex-col space-y-12">
                <div className="h-[550px]">
                    <SlantedPanel variant="blue" className="w-[105%] -ml-[5%]">
                        <div className="flex flex-col h-full text-white pt-8 px-8">
                            <h2 className="text-[44px] font-black uppercase leading-[0.9] tracking-tighter mb-10 shadow-sm drop-shadow-md">
                                ADD<br />NEW RULE
                            </h2>

                            <div className="space-y-6 flex-1">
                                {/* Form Element 1 */}
                                <div>
                                    <label className="text-[9px] font-black tracking-widest uppercase text-white/90 mb-2 block drop-shadow-sm">ID_IDENTIFIER</label>
                                    <input
                                        type="text"
                                        defaultValue="RULE_NAME_V2"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white font-black text-[14px] uppercase tracking-widest focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all placeholder:text-white/40"
                                    />
                                </div>

                                {/* Form Element 2 */}
                                <div>
                                    <label className="text-[9px] font-black tracking-widest uppercase text-white/90 mb-2 block drop-shadow-sm">PRIORITY_STRENGTH</label>
                                    <div className="flex space-x-2">
                                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 text-[12px] font-black tracking-widest transition-colors border border-white/10">LOW</button>
                                        <button className="flex-1 bg-white text-black rounded-xl py-3 text-[12px] font-black tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.4)]">MID</button>
                                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 text-[12px] font-black tracking-widest transition-colors border border-white/10">HIGH</button>
                                    </div>
                                </div>

                                {/* Form Element 3 */}
                                <div>
                                    <label className="text-[9px] font-black tracking-widest uppercase text-white/90 mb-2 block drop-shadow-sm">LOGIC_FLOW</label>
                                    <div className="w-full bg-black/10 border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-black/20 hover:border-white/40 transition-colors">
                                        <div className="grid grid-cols-2 gap-1 mb-3 opacity-80">
                                            <div className="w-4 h-4 bg-white rounded-sm"></div>
                                            <div className="w-4 h-4 bg-white/50 rounded-sm"></div>
                                            <div className="col-span-2 w-full h-4 bg-white rounded-sm"></div>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest font-black text-white/80">CONFIGURE CONDITIONS</span>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-10 mb-12 bg-black hover:bg-black/80 text-white rounded-[16px] py-5 text-[14px] font-black tracking-widest uppercase transition-all flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 hover:scale-[1.02]">
                                DEPLOY RULE ⚡
                            </button>
                        </div>
                    </SlantedPanel>
                </div>

                {/* Bottom Telemetry */}
                <div className="flex space-x-12 px-6">
                    <div>
                        <div className="text-[32px] font-black text-white tracking-tighter">99.9%</div>
                        <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/30">UPTIME CONFIDENCE</div>
                    </div>
                    <div>
                        <div className="text-[32px] font-black text-white tracking-tighter">2.4<span className="text-xl">ms</span></div>
                        <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/30">LATENT OVERHEAD</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
 
