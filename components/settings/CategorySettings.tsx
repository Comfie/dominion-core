'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Save, Loader2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { categoryConfig } from '@/types/finance';

interface CategoryKeywords {
    [category: string]: string[];
}

interface KeywordSettings {
    added: CategoryKeywords;      // Custom keywords added by user
    removed: CategoryKeywords;    // Default keywords removed by user
}

// Default keywords from the parser
const DEFAULT_KEYWORDS: CategoryKeywords = {
    GROCERIES: ['checkers', 'pick n pay', 'woolworths', 'spar', 'shoprite', 'food lover', 'makro', 'game', 'pnp', 'clicks', 'dischem', 'dis-chem', 'massmart'],
    TRANSPORT: ['uber', 'bolt', 'shell', 'engen', 'sasol', 'bp ', 'caltex', 'petroport', 'petrol', 'fuel', 'e-toll', 'sanral', 'aa ', 'parking', 'cartrack', 'total '],
    UTILITIES: ['eskom', 'city of', 'municipality', 'water', 'electricity', 'telkom', 'vodacom', 'mtn', 'cell c', 'rain ', 'fibre', 'dstv', 'multichoice', 'afrihost'],
    ENTERTAINMENT: ['netflix', 'spotify', 'apple.com', 'google', 'youtube', 'steam', 'playstation', 'xbox', 'showmax', 'ster-kinekor', 'nu metro', 'claude.ai'],
    DINING: ['restaurant', 'cafe', 'coffee', 'mcdonald', 'kfc', 'nando', 'spur', 'steers', 'debonairs', 'pizza', 'wimpy', 'mugg', 'vida', 'starbucks', 'xpresso', 'baglios'],
    SHOPPING: ['takealot', 'amazon', 'shein', 'zara', 'h&m', 'mr price', 'edgars', 'foschini', 'truworths', 'jet ', 'ackermans', 'pep ', 'bash', 'shoe city', 'leroy merlin'],
    LIVING: ['discovery', 'medscheme', 'medical', 'pharmacy', 'doctor', 'dentist', 'hospital', 'clinic', 'netcare', 'mediclinic', 'medirite'],
    INSURANCE: ['insurance', 'sanlam', 'old mutual', 'liberty', 'momentum', 'outsurance', 'santam', 'dialdirect', 'budget insurance', 'miway'],
    HOUSING: ['levies', 'rent', 'bond', 'nedbhl', 'home loan', 'graceland'],
    DEBT: ['loan', 'repayment'],
    SAVINGS: [],
    OTHER: [],
};

export function CategorySettings() {
    const [settings, setSettings] = useState<KeywordSettings>({ added: {}, removed: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [newKeyword, setNewKeyword] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/category-keywords');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    added: data.added || {},
                    removed: data.removed || {},
                });
            }
        } catch (err) {
            console.error('Error fetching keyword settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Get effective keywords for a category (defaults + added - removed)
    const getEffectiveKeywords = (category: string): { keyword: string; isDefault: boolean; isRemoved: boolean }[] => {
        const defaults = DEFAULT_KEYWORDS[category] || [];
        const added = settings.added[category] || [];
        const removed = settings.removed[category] || [];

        const keywords: { keyword: string; isDefault: boolean; isRemoved: boolean }[] = [];

        // Add default keywords (mark if removed)
        defaults.forEach(k => {
            keywords.push({
                keyword: k,
                isDefault: true,
                isRemoved: removed.includes(k),
            });
        });

        // Add custom keywords
        added.forEach(k => {
            keywords.push({
                keyword: k,
                isDefault: false,
                isRemoved: false,
            });
        });

        return keywords;
    };

    // Get active keywords count
    const getActiveCount = (category: string): number => {
        const keywords = getEffectiveKeywords(category);
        return keywords.filter(k => !k.isRemoved).length;
    };

    const handleAddKeyword = (category: string) => {
        if (!newKeyword.trim()) return;
        const keyword = newKeyword.trim().toLowerCase();

        // Check if already exists in defaults or added
        const defaults = DEFAULT_KEYWORDS[category] || [];
        const added = settings.added[category] || [];

        if (defaults.includes(keyword) || added.includes(keyword)) {
            setError('Keyword already exists');
            setTimeout(() => setError(''), 2000);
            return;
        }

        setSettings(prev => ({
            ...prev,
            added: {
                ...prev.added,
                [category]: [...(prev.added[category] || []), keyword],
            },
        }));
        setNewKeyword('');
    };

    const handleRemoveKeyword = (category: string, keyword: string, isDefault: boolean) => {
        if (isDefault) {
            // Add to removed list
            setSettings(prev => ({
                ...prev,
                removed: {
                    ...prev.removed,
                    [category]: [...(prev.removed[category] || []), keyword],
                },
            }));
        } else {
            // Remove from added list
            setSettings(prev => ({
                ...prev,
                added: {
                    ...prev.added,
                    [category]: (prev.added[category] || []).filter(k => k !== keyword),
                },
            }));
        }
    };

    const handleRestoreKeyword = (category: string, keyword: string) => {
        // Remove from removed list
        setSettings(prev => ({
            ...prev,
            removed: {
                ...prev.removed,
                [category]: (prev.removed[category] || []).filter(k => k !== keyword),
            },
        }));
    };

    const handleResetCategory = (category: string) => {
        setSettings(prev => ({
            added: {
                ...prev.added,
                [category]: [],
            },
            removed: {
                ...prev.removed,
                [category]: [],
            },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/settings/category-keywords', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setSuccess('Keywords saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            setError('Failed to save keywords');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--dc-primary)]" />
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-[var(--dc-primary)]" />
                    <h2 className="text-xl font-semibold text-[var(--dc-text-primary)]">
                        Category Keywords
                    </h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-[var(--dc-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save
                </button>
            </div>

            <p className="text-sm text-[var(--dc-text-muted)] mb-4">
                Customize keywords for automatic expense categorization. Add your own keywords or remove defaults that don&apos;t apply to you.
            </p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
                    {success}
                </div>
            )}

            <div className="space-y-2">
                {Object.entries(categoryConfig).map(([category, config]) => {
                    const keywords = getEffectiveKeywords(category);
                    const activeCount = getActiveCount(category);
                    const customCount = (settings.added[category] || []).length;
                    const removedCount = (settings.removed[category] || []).length;
                    const isExpanded = expandedCategory === category;
                    const hasChanges = customCount > 0 || removedCount > 0;

                    return (
                        <div key={category} className="border border-[var(--dc-border)] rounded-xl overflow-hidden">
                            <div
                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                className="w-full flex items-center justify-between p-3 hover:bg-[var(--dc-bg-secondary)] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: config.color }}
                                    />
                                    <span className="font-medium text-[var(--dc-text-primary)]">
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-[var(--dc-text-muted)]">
                                        {activeCount} active
                                        {customCount > 0 && (
                                            <span className="ml-1 text-green-400">+{customCount}</span>
                                        )}
                                        {removedCount > 0 && (
                                            <span className="ml-1 text-red-400">-{removedCount}</span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasChanges && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleResetCategory(category);
                                            }}
                                            className="p-1 rounded hover:bg-[var(--dc-bg-elevated)] text-[var(--dc-text-muted)] hover:text-amber-400"
                                            title="Reset to defaults"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-[var(--dc-text-muted)]" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-[var(--dc-text-muted)]" />
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-[var(--dc-border)]"
                                    >
                                        <div className="p-3 space-y-3">
                                            {/* Add new keyword */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newKeyword}
                                                    onChange={(e) => setNewKeyword(e.target.value)}
                                                    placeholder="Add new keyword..."
                                                    className="flex-1 bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-lg py-2 px-3 text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)]"
                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword(category)}
                                                />
                                                <button
                                                    onClick={() => handleAddKeyword(category)}
                                                    disabled={!newKeyword.trim()}
                                                    className="px-3 py-2 rounded-lg bg-[var(--dc-primary)] text-white disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Active keywords */}
                                            <div>
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-2">Active keywords:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {keywords.filter(k => !k.isRemoved).map((item, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${item.isDefault
                                                                ? 'bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)]'
                                                                : 'bg-green-500/20 text-green-400'
                                                                }`}
                                                        >
                                                            {item.keyword}
                                                            <button
                                                                onClick={() => handleRemoveKeyword(category, item.keyword, item.isDefault)}
                                                                className="hover:text-red-400 transition-colors"
                                                                title="Remove keyword"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {keywords.filter(k => !k.isRemoved).length === 0 && (
                                                        <span className="text-xs text-[var(--dc-text-muted)]">No keywords</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Removed keywords */}
                                            {keywords.filter(k => k.isRemoved).length > 0 && (
                                                <div>
                                                    <p className="text-xs text-[var(--dc-text-muted)] mb-2">Removed keywords:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {keywords.filter(k => k.isRemoved).map((item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-500/10 text-red-400/60 line-through"
                                                            >
                                                                {item.keyword}
                                                                <button
                                                                    onClick={() => handleRestoreKeyword(category, item.keyword)}
                                                                    className="hover:text-green-400 transition-colors"
                                                                    title="Restore keyword"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
