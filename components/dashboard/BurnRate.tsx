'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, ChevronDown, ChevronUp, Edit2, CheckCircle } from 'lucide-react';
import { Obligation, categoryConfig } from '@/types/finance';
import Link from 'next/link';

interface BurnRateProps {
    obligations: Obligation[];
    onEditObligation?: (obligation: Obligation) => void;
    onRecordPayment?: (obligation: Obligation) => void;
}

export function BurnRate({ obligations, onEditObligation, onRecordPayment }: BurnRateProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const uncompromisedObligations = obligations.filter(o => o.isUncompromised);
    const totalBurnRate = uncompromisedObligations.reduce((sum, o) => sum + o.amount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-[var(--dc-text-muted)]">Monthly Burn Rate</p>
                        <p className="text-xs text-[var(--dc-text-muted)]">Uncompromised costs</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                >
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    )}
                </button>
            </div>

            {/* Total */}
            <div className="mb-4">
                <p className="text-3xl font-bold text-red-400">
                    R {totalBurnRate.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-[var(--dc-text-muted)] mt-1">
                    {uncompromisedObligations.length} obligation{uncompromisedObligations.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Expandable List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2 overflow-hidden"
                    >
                        {uncompromisedObligations.map((obligation, index) => (
                            <motion.div
                                key={obligation.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group p-3 rounded-lg bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] hover:border-[var(--dc-primary)] transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: categoryConfig[obligation.category].color }}
                                            />
                                            <p className="text-sm font-medium text-[var(--dc-text-primary)]">
                                                {obligation.name}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[var(--dc-text-muted)] mt-1">
                                            Due: {obligation.debitOrderDate}{getOrdinalSuffix(obligation.debitOrderDate)} of month
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--dc-text-primary)]">
                                            R {obligation.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onRecordPayment && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRecordPayment(obligation);
                                                    }}
                                                    className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors"
                                                    title="Record payment"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                </button>
                                            )}
                                            {onEditObligation && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditObligation(obligation);
                                                    }}
                                                    className="w-7 h-7 rounded-lg bg-[var(--dc-primary)]/20 flex items-center justify-center hover:bg-[var(--dc-primary)]/30 transition-colors"
                                                    title="Edit obligation"
                                                >
                                                    <Edit2 className="w-4 h-4 text-[var(--dc-primary)]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View All Link */}
            <Link
                href="/obligations"
                className="block mt-4 text-center py-2 px-4 rounded-xl bg-[var(--dc-bg-secondary)] hover:bg-[var(--dc-bg-elevated)] text-sm text-[var(--dc-primary)] font-medium transition-colors"
            >
                Manage All Obligations →
            </Link>
        </motion.div>
    );
}

function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}
