import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RuleCard, type FlowGuardRule } from '../components/RuleCard';
import { PageHeader } from '../components/PageHeader';
import { PillButton } from '../components/PillButton';
import { CreateRuleModal } from '../components/CreateRuleModal';
import { useToast } from '../context/ToastContext';
import { exportRulesJSON, parseRulesJSON } from '../utils/export';
import { Search, Filter, ArrowUpDown, Download, Upload, Shield, Plus } from 'lucide-react';
import { cn } from '../utils/cn';

type SortKey = 'name' | 'severity' | 'enabled';
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function Rules() {
    const [rules, setRules] = useState<FlowGuardRule[]>([]);
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState('all');
    const [sortBy, setSortBy] = useState<SortKey>('severity');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/rules')
            .then(res => res.json())
            .then(setRules)
            .catch(() => addToast('Failed to load rules', 'error'));
    }, [addToast]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        rules.forEach(r => r.tags.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [rules]);

    const filteredRules = useMemo(() => {
        let result = [...rules];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.tags.some(t => t.toLowerCase().includes(q))
            );
        }

        if (tagFilter !== 'all') {
            result = result.filter(r => r.tags.includes(tagFilter));
        }

        result.sort((a, b) => {
            if (sortBy === 'name') return a.title.localeCompare(b.title);
            if (sortBy === 'enabled') return Number(b.enabled) - Number(a.enabled);
            const sa = SEVERITY_ORDER[a.severity ?? 'medium'] ?? 2;
            const sb = SEVERITY_ORDER[b.severity ?? 'medium'] ?? 2;
            return sa - sb;
        });

        return result;
    }, [rules, search, tagFilter, sortBy]);

    const enabledCount = rules.filter(r => r.enabled).length;
    const totalHits = rules.reduce((sum, r) => sum + (r.hits ?? 0), 0);

    const handleToggle = async (id: string, enabled: boolean) => {
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
                setRules(data.rules);
                const rule = data.rules.find((r: FlowGuardRule) => r.id === id);
                addToast(`${rule?.title ?? 'Rule'} ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'success' : 'info');
            } else {
                setRules(previousRules);
                addToast('Failed to update rule', 'error');
            }
        } catch {
            setRules(previousRules);
            addToast('Failed to update rule', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const rule = rules.find(r => r.id === id);
        try {
            const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setRules(data.rules);
                addToast(`${rule?.title ?? 'Rule'} deleted`, 'info');
            } else {
                addToast('Failed to delete rule', 'error');
            }
        } catch {
            addToast('Failed to delete rule', 'error');
        }
    };

    const handleRuleCreated = (newRule: FlowGuardRule) => {
        setRules(prev => [...prev, newRule]);
        addToast(`Rule "${newRule.title}" created`, 'success');
    };

    const handleExport = () => {
        exportRulesJSON(rules);
        addToast('Rules exported to JSON', 'success');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const imported = parseRulesJSON(text);
            const res = await fetch('/api/rules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules: imported }),
            });
            const data = await res.json();
            if (data.success) {
                setRules(data.rules);
                addToast(`Imported ${imported.length} rules`, 'success');
            } else {
                addToast('Import failed', 'error');
            }
        } catch (err: any) {
            addToast(err.message || 'Invalid rules file', 'error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col max-w-4xl mx-auto w-full mt-4">
            <div className="flex-1 flex flex-col">
                <div className="relative">
                    <PageHeader
                        titleTop="RULE"
                        titleBottom="ENGINE"
                        subtitle="Expressive, high-performance deep packet inspection. Designed for absolute control and visual clarity."
                    />
                    <div className="absolute right-0 bottom-0 flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-allow/10 border border-signal-allow/20">
                            <Shield className="w-3 h-3 text-signal-allow" />
                            <span className="text-[10px] font-black tracking-widest text-signal-allow">
                                {enabledCount} ACTIVE
                            </span>
                        </div>
                        {totalHits > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-block/10 border border-signal-block/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-signal-block animate-pulse" />
                                <span className="text-[10px] font-black tracking-widest text-signal-block">
                                    {totalHits.toLocaleString()} BLOCKED
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search, filter, sort toolbar */}
                <div className="flex flex-col md:flex-row gap-3 mt-8 mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-accent-blue transition-colors" />
                        <input
                            type="text"
                            placeholder="Search rules by name, description, or tag..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-sm focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="relative w-full md:w-48 group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                        <select
                            value={tagFilter}
                            onChange={e => setTagFilter(e.target.value)}
                            className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-sm appearance-none focus:outline-none focus:border-border-focus cursor-pointer"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Tags</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full md:w-44 group">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortKey)}
                            className="w-full h-[44px] bg-card-alt border border-border-default rounded-[10px] pl-10 pr-4 text-sm appearance-none focus:outline-none focus:border-border-focus cursor-pointer"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <option value="severity">Sort: Severity</option>
                            <option value="name">Sort: Name</option>
                            <option value="enabled">Sort: Active First</option>
                        </select>
                    </div>
                </div>

                {/* Action row */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    <PillButton variant="primary" onClick={() => setShowCreateModal(true)} className="px-6 py-2 text-[12px]">
                        <span className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Rule
                        </span>
                    </PillButton>
                    <PillButton variant="secondary" onClick={handleExport} className="px-6 py-2 text-[12px]">
                        <span className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export JSON
                        </span>
                    </PillButton>
                    <PillButton variant="secondary" onClick={() => fileInputRef.current?.click()} className="px-6 py-2 text-[12px]">
                        <span className="flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Import JSON
                        </span>
                    </PillButton>
                    <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                </div>

                <div className="flex flex-col space-y-6">
                    {filteredRules.length === 0 ? (
                        <div className="text-center py-16 opacity-40">
                            <p className="text-sm font-bold uppercase tracking-widest">No rules match your filters</p>
                        </div>
                    ) : (
                        filteredRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                <p className={cn("text-[10px] font-mono mt-6 opacity-30 uppercase tracking-widest")}>
                    Showing {filteredRules.length} of {rules.length} rules
                </p>
            </div>

            <CreateRuleModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleRuleCreated}
            />
        </div>
    );
}
