import { cn } from '../utils/cn';

interface PageHeaderProps {
    titleTop: string;
    titleBottom: string;
    subtitle?: string;
    className?: string;
}

export function PageHeader({ titleTop, titleBottom, subtitle, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col mb-12", className)}>
            <div className="relative z-10">
                <h1 className="text-[120px] leading-[0.8] text-white font-black uppercase tracking-tighter drop-shadow-lg z-20 relative">
                    {titleTop}
                </h1>
                <h1 className="text-[120px] leading-[0.8] text-accent-blue font-black italic uppercase tracking-tighter -mt-2 z-10 relative drop-shadow-lg">
                    {titleBottom}
                </h1>
            </div>
            {subtitle && (
                <div className="relative pl-6 mt-12 mb-8">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue/50 rounded-full" />
                    <p className="text-[#A0A4A8] text-[16px] font-medium leading-relaxed max-w-lg">
                        {subtitle}
                    </p>
                </div>
            )}
        </div>
    );
}
