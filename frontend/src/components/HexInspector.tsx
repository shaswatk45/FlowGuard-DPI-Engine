import { useState } from 'react';
import { Terminal, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface HexRow {
    offset: string;
    hex: string;
    ascii: string;
}

const TLS_HEX: HexRow[] = [
    { offset: '0000', hex: '16 03 01 00 b8 01 00 00 b4 03 03 ec 3d f4 a0', ascii: '..........=..' },
    { offset: '0010', hex: '6e e3 dc db c8 c5 dc db ba fa 70 e2 c1 ad b9', ascii: 'n.......p....' },
    { offset: '0020', hex: '0a a3 34 d3 99 d9 fd a7 8b fa c2 f4 00 00 1c', ascii: '..4..........' },
    { offset: '0030', hex: '13 01 13 02 13 03 c0 2b c0 2f c0 09 c0 13 00', ascii: '.......+./...' },
    { offset: '0040', hex: '9c 00 9d 00 2f 00 35 00 0a 01 00 00 6f 00 00', ascii: '..../.5.....o..' },
    { offset: '0050', hex: '00 1a 00 18 00 00 15 77 77 77 2e 67 6f 6f 67', ascii: '.......www.goog' },
    { offset: '0060', hex: '6c 65 2e 63 6f 6d 00 0b 00 04 03 00 01 02 00', ascii: 'le.com.........' },
    { offset: '0070', hex: '0a 00 0a 00 08 00 1d 00 17 00 18 00 19 00 17', ascii: '...............' },
    { offset: '0080', hex: '00 00 00 16 00 00 17 00 00 00 0d 00 2a 00 28', ascii: '............*.' },
    { offset: '0090', hex: '04 03 05 03 06 03 08 07 08 08 08 09 08 0a 08', ascii: '...............' },
    { offset: '00a0', hex: '0b 08 04 08 05 08 06 04 01 05 01 06 01 02 01', ascii: '...............' },
    { offset: '00b0', hex: '03 01 02 03 00 2b 00 03 02 03 04 00 00 00 00', ascii: '.....+.........' }
];

const HTTP_HEX: HexRow[] = [
    { offset: '0000', hex: '47 45 54 20 2f 20 48 54 54 50 2f 31 2e 31 0d', ascii: 'GET / HTTP/1.1.' },
    { offset: '0010', hex: '0a 48 6f 73 74 3a 20 65 78 61 6d 70 6c 65 2e', ascii: '.Host: example.' },
    { offset: '0020', hex: '63 6f 6d 0d 0a 55 73 65 72 2d 41 67 65 6e 74', ascii: 'com..User-Agent' },
    { offset: '0030', hex: '3a 20 46 6c 6f 77 47 75 61 72 64 20 44 50 49', ascii: ': FlowGuard DPI' },
    { offset: '0040', hex: '20 54 65 73 74 0d 0a 41 63 63 65 70 74 3a 20', ascii: ' Test..Accept: ' },
    { offset: '0050', hex: '2a 2f 2a 0d 0a 43 6f 6e 6e 65 63 74 69 6f 6e', ascii: '*/*..Connection' },
    { offset: '0060', hex: '3a 20 63 6c 6f 73 65 0d 0a 0d 0a 00 00 00 00', ascii: ': close........' }
];

const DNS_HEX: HexRow[] = [
    { offset: '0000', hex: '24 8a 01 00 00 01 00 00 00 00 00 00 03 77 77', ascii: '$............ww' },
    { offset: '0010', hex: '77 0c 66 6c 6f 77 67 75 61 72 64 2d 64 70 69', ascii: 'w.flowguard-dpi' },
    { offset: '0020', hex: '03 6e 65 74 00 00 01 00 01 00 00 29 10 00 00', ascii: '.net.......)....' },
    { offset: '0030', hex: '00 00 00 00 0c 00 0a 00 08 cc a0 d3 fd a7 8b', ascii: '...............' },
    { offset: '0040', hex: 'fa c2 f4 00 00 00 00 00 00 00 00 00 00 00 00', ascii: '...............' }
];

type ProtocolType = 'tls' | 'http' | 'dns';

export function HexInspector() {
    const [selectedProto, setSelectedProto] = useState<ProtocolType>('tls');

    const getHexData = () => {
        if (selectedProto === 'http') return HTTP_HEX;
        if (selectedProto === 'dns') return DNS_HEX;
        return TLS_HEX;
    };

    const getHeaderDetails = () => {
        if (selectedProto === 'http') {
            return {
                title: 'HTTP Layer (GET Request)',
                desc: 'Plaintext hyper-text transfer protocol. Easily inspected by basic port-matching rules.'
            };
        }
        if (selectedProto === 'dns') {
            return {
                title: 'DNS Layer (Query Request)',
                desc: 'Domain Name System resolver query. FlowGuard parses query labels to inspect target host destinations.'
            };
        }
        return {
            title: 'TLS Layer (Client Hello Handshake)',
            desc: 'Secured SSL/TLS Client Hello. FlowGuard extracts the SNI (Server Name Indication) extension from bytes [0x54 - 0x65] to detect targeted domains prior to encryption.'
        };
    };

    const details = getHeaderDetails();
    const hexData = getHexData();

    return (
        <div className="bg-[#0a0a0a] rounded-[24px] border border-white/5 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-1">
                        DPI Packet Hex Inspector
                    </div>
                    <div className="text-sm font-bold text-white/60">
                        Interactive Layer-7 Raw Packet Stream Decoder
                    </div>
                </div>

                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                    {(['tls', 'http', 'dns'] as ProtocolType[]).map(proto => (
                        <button
                            key={proto}
                            onClick={() => setSelectedProto(proto)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                selectedProto === proto ? "bg-accent-blue text-white" : "text-white/40 hover:text-white"
                            )}
                        >
                            {proto.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hex Stream Console */}
                <div className="lg:col-span-2 bg-black border border-white/10 rounded-2xl p-5 font-mono text-[11px] leading-relaxed text-emerald-400 select-all overflow-x-auto">
                    <div className="text-white/30 border-b border-white/5 pb-2 mb-2 flex justify-between select-none">
                        <span>Offset</span>
                        <span>Hexadecimal Stream Representation</span>
                        <span>ASCII Decode</span>
                    </div>
                    {hexData.map((row, idx) => (
                        <div key={idx} className="flex justify-between hover:bg-white/5 px-1 rounded transition-colors">
                            <span className="text-white/30 mr-4 select-none">{row.offset}</span>
                            <span className="text-emerald-400 flex-1 tracking-wider mr-6">{row.hex}</span>
                            <span className="text-white/50 w-28 text-right font-sans tracking-wide">{row.ascii}</span>
                        </div>
                    ))}
                </div>

                {/* Analysis detail panel */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-accent-blue">
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">{details.title}</span>
                        </div>
                        <p className="text-[12px] text-white/50 leading-relaxed font-medium">
                            {details.desc}
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-3 font-mono text-[10px] text-white/40">
                        <div className="flex justify-between">
                            <span>MATCH STATE:</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> DECODED
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>HEX OFFSET:</span>
                            <span className="text-white/70">0x0000 - 0x00BF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
