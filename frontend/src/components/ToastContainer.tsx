import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/cn';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warn: AlertTriangle,
};

const COLORS = {
    success: 'border-signal-allow/30 bg-signal-allow/10 text-signal-allow',
    error: 'border-signal-block/30 bg-signal-block/10 text-signal-block',
    info: 'border-signal-info/30 bg-signal-info/10 text-signal-info',
    warn: 'border-signal-warn/30 bg-signal-warn/10 text-signal-warn',
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
            {toasts.map(toast => {
                const Icon = ICONS[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300',
                            COLORS[toast.type]
                        )}
                    >
                        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-white flex-1">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
