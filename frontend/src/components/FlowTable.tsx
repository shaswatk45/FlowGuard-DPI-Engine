import { cn } from '../utils/cn';
import { StatusTag, type SignalColor } from './StatusTag';

export interface FlowRecord {
    id: string;
    action: 'ALLOW' | 'DROP';
    srcIp: string;
    dstIp: string;
    proto: string;
    size: string;
    timestamp: string;
}

interface FlowTableProps {
    data: FlowRecord[];
}

export function FlowTable({ data }: FlowTableProps) {
    const getSignalForStatus = (status: string): SignalColor => {
        return status === 'ALLOW' ? 'allow' : 'block';
    };

    const getProtoColor = (proto: string) => {
        if (proto.includes('TLS')) return 'bg-accent-blue';
        if (proto.includes('SSH')) return 'bg-[#ff4d4f]';
        if (proto.includes('TCP')) return 'bg-signal-info';
        if (proto.includes('UDP')) return 'bg-accent-blue';
        if (proto.includes('PING')) return 'bg-[#ff4d4f]';
        return 'bg-white/50';
    };

    return (
        <div className="w-full bg-[#0a0a0a] rounded-[24px] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto p-4 md:p-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['ACTION', 'SOURCE IP', 'DESTINATION IP', 'PROTOCOL', 'SIZE', 'TIMESTAMP'].map(header => (
                                <th key={header} className="px-4 py-6 text-[10px] text-white/40 font-black tracking-widest uppercase">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="font-mono text-[13px]">
                        {data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors h-[72px]"
                            >
                                <td className="px-4 py-2">
                                    <StatusTag status={row.action} signal={getSignalForStatus(row.action)} />
                                </td>
                                <td className="px-4 py-2 text-white font-bold tracking-wider">
                                    {row.srcIp}
                                </td>
                                <td className="px-4 py-2 text-white/60 tracking-wider">
                                    {row.dstIp}
                                </td>
                                <td className="px-4 py-2 text-white/90 font-bold tracking-widest flex items-center h-[72px]">
                                    <div className={cn("w-2 h-2 rounded-full mr-3", getProtoColor(row.proto))} />
                                    {row.proto}
                                </td>
                                <td className="px-4 py-2 text-white/40 tracking-wider">
                                    {row.size}
                                </td>
                                <td className="px-4 py-2 text-white/20 tracking-wider text-right pr-4">
                                    {row.timestamp}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="p-8 text-center text-white/30 italic font-mono">
                        No packets recorded.
                    </div>
                )}
            </div>
        </div>
    );
}
 
