import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, Terminal, Shield } from 'lucide-react';
import { cn } from '../utils/cn';
import type { FlowGuardRule } from './RuleCard';

interface CreateRuleModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (rule: FlowGuardRule) => void;
}

const SEVERITY_OPTIONS = [
    { value: 'low',      label: 'Low',      color: '#34d399' },
    { value: 'medium',   label: 'Medium',   color: '#fbbf24' },
    { value: 'high',     label: 'High',     color: '#f97316' },
    { value: 'critical', label: 'Critical', color: '#ff4d4f' },
] as const;

const TAG_OPTIONS = ['#SECURITY', '#BANDWIDTH', '#QOS', '#COMPLIANCE', '#BLOCK-APP', '#BLOCK-IP', '#RATE-LIMIT', '#CUSTOM'];

export function CreateRuleModal({ open, onClose, onCreated }: CreateRuleModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [tags, setTags] = useState<string[]>([]);
    const [flag, setFlag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset on open
    useEffect(() => {
        if (open) { setTitle(''); setDescription(''); setSeverity('medium'); setTags([]); setFlag(''); setError(''); }
    }, [open]);

    const toggleTag = (tag: string) =>
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Rule title is required.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/rules/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, severity, tags, flag }),
            });
            const data = await res.json();
            if (data.success) {
                onCreated(data.rule);
                onClose();
            } else {
                setError(data.error || 'Failed to create rule.');
            }
        } catch {
            setError('Network error. Is the backend running?');
        }
        setLoading(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-slide-up">
                {/* Top accent */}
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4B8DFF, #a78bfa, #ff4d4f)' }} />

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">RULE ENGINE</div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Create New Rule</h2>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Rule Title *</label>
                            <input
                                type="text" value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. BLOCK MALICIOUS C2"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-[12px] px-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-accent-blue transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="What does this rule do?"
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-[12px] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent-blue resize-none transition-colors"
                            />
                        </div>

                        {/* Severity */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Severity
                            </label>
                            <div className="flex gap-2">
                                {SEVERITY_OPTIONS.map(s => (
                                    <button key={s.value} type="button"
                                        onClick={() => setSeverity(s.value)}
                                        className={cn(
                                            'flex-1 h-9 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all border',
                                            severity === s.value
                                                ? 'border-transparent text-black'
                                                : 'border-white/10 text-white/40 hover:border-white/20'
                                        )}
                                        style={severity === s.value ? { backgroundColor: s.color, boxShadow: `0 0 16px ${s.color}60` } : {}}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                <Tag className="w-3 h-3" /> Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TAG_OPTIONS.map(tag => (
                                    <button key={tag} type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all border',
                                            tags.includes(tag)
                                                ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                                                : 'border-white/10 text-white/30 hover:border-white/20'
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CLI Flag */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                <Terminal className="w-3 h-3" /> Engine Flag (optional)
                            </label>
                            <input
                                type="text" value={flag} onChange={e => setFlag(e.target.value)}
                                placeholder="e.g. --block-domain example.com"
                                className="w-full h-10 bg-black/30 border border-white/10 rounded-[10px] px-4 text-[12px] font-mono text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>

                        {error && <p className="text-signal-block text-[11px] font-bold">{error}</p>}

                        <button
                            type="submit" disabled={loading}
                            className="w-full h-12 rounded-[14px] font-black text-[13px] uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #4B8DFF, #a78bfa)', boxShadow: '0 8px 24px rgba(75,141,255,0.3)' }}
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Plus className="w-4 h-4" /> Create Rule</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
