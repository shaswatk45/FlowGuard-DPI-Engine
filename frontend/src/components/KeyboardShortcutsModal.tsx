import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { keys: ['G', 'U'], action: 'Go to Upload' },
    { keys: ['G', 'D'], action: 'Go to Dashboard' },
    { keys: ['G', 'R'], action: 'Go to Rules' },
    { keys: ['Alt', '1'], action: 'Upload page' },
    { keys: ['Alt', '2'], action: 'Rules page' },
    { keys: ['Alt', '3'], action: 'Analytics page' },
    { keys: ['?'], action: 'Toggle this help' },
    { keys: ['Esc'], action: 'Close dialogs' },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-card border border-border-default rounded-[24px] p-8 max-w-md w-full mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm text-white/70">{s.action}</span>
                            <div className="flex gap-1">
                                {s.keys.map((k, j) => (
                                    <kbd key={j} className="px-2 py-1 bg-white/10 rounded-md text-[11px] font-mono font-bold text-white/90">
                                        {k}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
