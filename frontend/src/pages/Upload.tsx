import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PcapDropZone } from '../components/PcapDropZone';
import { ProgressLog } from '../components/ProgressLog';
import { SlantedPanel } from '../components/SlantedPanel';
import { PageHeader } from '../components/PageHeader';
import { PillButton } from '../components/PillButton';
import { useAnalytics } from '../context/AnalyticsContext';
import { Activity, ShieldAlert, FileText, Download, BarChart2 } from 'lucide-react';

export function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [done, setDone] = useState(false);
    const { setAnalytics } = useAnalytics();
    const navigate = useNavigate();

    const handleStartAnalysis = async () => {
        if (!file) return;
        setIsProcessing(true);
        setDone(false);
        setLogs([{ id: '1', time: new Date().toISOString().slice(11, 19), level: 'info', message: `Sending ${file.name} to Deep Packet Inspection Edge...` }]);
        setProgress(15);

        const formData = new FormData();
        formData.append('pcap', file);

        try {
            const response = await fetch('/api/analyze', { method: 'POST', body: formData });
            setProgress(60);
            const data = await response.json();

            if (response.ok) {
                // Save structured analytics to global context
                if (data.analytics) setAnalytics(data.analytics);

                setLogs(prev => [
                    ...prev,
                    { id: 'ok', time: new Date().toISOString().slice(11, 19), level: 'success', message: `✓ Analysis complete — ${data.analytics?.totalPackets ?? '?'} packets, ${data.analytics?.appBreakdown?.length ?? 0} application types detected.` },
                    ...(data.logs || [])
                ]);
                setProgress(100);
                setDone(true);
            } else {
                setLogs(prev => [
                    ...prev,
                    { id: 'err', time: new Date().toISOString().slice(11, 19), level: 'error', message: data.error || 'Execution failed.' },
                ]);
                setProgress(0);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, { id: 'err', time: new Date().toISOString().slice(11, 19), level: 'error', message: `Server error: ${error.message}` }]);
            setProgress(0);
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="flex flex-col xl:flex-row gap-12 w-full mt-4">

            {/* Left System Alert Panel */}
            <div className="w-full xl:w-[350px] shrink-0 h-[800px]">
                <SlantedPanel variant="black" className="w-[105%] -ml-[5%]">
                    {/* Background tint trick since SlantedPanel currently might just be black/blue. We can overlay red */}
                    <div className="absolute inset-0 bg-signal-block/10 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[4px] h-full bg-signal-block" />

                    <div className="flex flex-col h-full text-white pt-12 px-6 relative z-10">
                        <ShieldAlert className="w-12 h-12 text-signal-block mb-8" />

                        <h2 className="text-[44px] font-black italic uppercase leading-[0.9] tracking-tighter mb-4 text-signal-block drop-shadow-[0_0_15px_rgba(255,77,79,0.4)]">
                            SYSTEM<br />ALERT
                        </h2>

                        <div className="mb-12">
                            <div className="bg-signal-block text-black text-[10px] font-black tracking-widest uppercase px-3 py-1 inline-block mb-4">CRITICAL SECURITY WARNING</div>
                            <p className="text-sm font-medium text-white/80 leading-relaxed">
                                Multiple authentication failures detected across perimeter nodes. Immediate analysis of inbound traffic drops is highly recommended.
                            </p>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-signal-block/70 mb-1">INCIDENT TYPE</div>
                                <div className="font-mono text-sm">UNAUTHORIZED_ACCESS_DETECTED</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-signal-block/70 mb-1">NODE</div>
                                <div className="font-mono text-sm">0x8F9A2 (FRANKFURT_DC)</div>
                            </div>
                        </div>

                        <PillButton variant="danger" className="w-full mt-auto mb-12 h-16 shadow-[0_10px_30px_rgba(255,77,79,0.3)]">
                            INITIATE LOCKDOWN 🔒
                        </PillButton>
                    </div>
                </SlantedPanel>
            </div>

            {/* Right Main Interface */}
            <div className="flex-1 flex flex-col pt-8">

                <PageHeader
                    titleTop="DATA"
                    titleBottom="INGEST"
                    subtitle="Upload network captures for deep behavioral and structural analysis against the current ruleset."
                />

                <div className="mt-8 mb-8">
                    <PcapDropZone onFileSelect={setFile} />
                </div>

                <div className="flex items-center gap-4 mb-12">
                    <PillButton
                        variant="primary"
                        onClick={handleStartAnalysis}
                        disabled={!file || isProcessing}
                        className="px-12 py-4 text-[14px]"
                    >
                        {isProcessing ? (
                            <span className="flex items-center space-x-3">
                                <Activity className="w-5 h-5 animate-spin" />
                                <span>PROCESSING INCIDENT {progress}%</span>
                            </span>
                        ) : (
                            'EXECUTE ANALYSIS'
                        )}
                    </PillButton>

                    {done && (
                        <PillButton
                            variant="secondary"
                            onClick={() => navigate('/dashboard')}
                            className="px-10 py-4 text-[14px]"
                        >
                            <span className="flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" />
                                VIEW ANALYTICS
                            </span>
                        </PillButton>
                    )}
                </div>

                {isProcessing || logs.length > 0 ? (
                    <div className="mt-8">
                        <h3 className="text-[14px] font-black tracking-widest text-white/50 uppercase mb-4">Engine Output Log</h3>
                        <ProgressLog logs={logs} progress={progress} className="h-64 rounded-[24px] border-white/5 bg-[#0a0a0a]" />
                    </div>
                ) : (
                    <div className="mt-8 flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[12px] font-black tracking-widest text-white/50 uppercase">RECENT INGESTIONS</h3>
                            <button className="text-[10px] font-bold text-accent-blue tracking-widest hover:text-white transition-colors">VIEW ALL HISTORY</button>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="text-[12px] font-mono text-white/70">
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors h-[64px]">
                                        <td className="px-6 py-4 flex items-center space-x-4 h-[64px]">
                                            <FileText className="w-4 h-4 text-white/30" />
                                            <span className="font-bold text-white tracking-widest">capture_eth0_14-20.pcap</span>
                                        </td>
                                        <td className="px-6 py-4">84.2 MB</td>
                                        <td className="px-6 py-4">12 MIN AGO</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors inline-block">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors h-[64px]">
                                        <td className="px-6 py-4 flex items-center space-x-4 h-[64px]">
                                            <FileText className="w-4 h-4 text-white/30" />
                                            <span className="font-bold text-white tracking-widest">malware_sample_0xAB.pcapng</span>
                                        </td>
                                        <td className="px-6 py-4">12.1 MB</td>
                                        <td className="px-6 py-4">2 HOURS AGO</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors inline-block">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
