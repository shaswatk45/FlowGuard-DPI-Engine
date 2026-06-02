import { Search, Filter, Hash } from 'lucide-react';
import { cn } from '../utils/cn';

interface FilterBarProps {
    className?: string;
    onFilterChange?: (filters: any) => void;
}

export function FilterBar({ className }: FilterBarProps) {
    return (
        <div className={cn("flex space-x-4", className)}>
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-border-focus transition-colors" />
                <input
                    type="text"
                    placeholder="Search SNI / Application..."
                    className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-body text-white placeholder:text-white/30 focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all shadow-sm"
                />
            </div>

            <div className="relative w-64 group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-border-focus transition-colors" />
                <input
                    type="text"
                    placeholder="IP Address"
                    className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-body text-white placeholder:text-white/30 focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all font-mono text-table-data shadow-sm"
                />
            </div>

            <div className="relative w-48 group">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-border-focus transition-colors" />
                <input
                    type="text"
                    placeholder="Protocol (e.g. TCP)"
                    className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-body text-white placeholder:text-white/30 focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all font-mono uppercase text-table-data shadow-sm"
                />
            </div>
        </div>
    );
}
 
