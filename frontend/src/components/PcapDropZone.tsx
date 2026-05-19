import { useState } from 'react';
import { cn } from '../utils/cn';

interface PcapDropZoneProps {
    onFileSelect: (file: File) => void;
    className?: string;
}

export function PcapDropZone({ onFileSelect, className }: PcapDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            onFileSelect(droppedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            onFileSelect(selectedFile);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative flex flex-col items-center justify-center p-16 rounded-[32px] border-4 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden min-h-[400px]",
                isDragging
                    ? "border-accent-blue bg-accent-blue/5 shadow-[0_0_50px_rgba(43,140,238,0.2)]"
                    : file
                        ? "border-signal-allow bg-signal-allow/5 border-solid"
                        : "border-white/10 border-dashed hover:border-white/30 hover:bg-white/[0.02]",
                className
            )}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept=".pcap,.pcapng"
            />

            {file ? (
                <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-signal-allow shadow-[0_0_15px_rgba(0,214,143,0.8)] mb-6" />
                    <h3 className="text-[32px] text-white font-black tracking-tighter uppercase mb-2">{file.name}</h3>
                    <p className="text-[14px] font-bold tracking-widest text-signal-allow uppercase">READY FOR INGESTION // {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <h3 className="text-[64px] text-white font-black italic uppercase leading-none tracking-tighter mb-4 text-center">
                        DRAG & DROP<br />PCAP FILES
                    </h3>
                    <div className="flex items-center space-x-6">
                        <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase">OR BROWSE LOCAL SYSTEM</span>
                        <span className="text-white/20">|</span>
                        <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase">MAXIMUM FILE SIZE 500MB</span>
                    </div>
                </div>
            )}
        </div>
    );
}
