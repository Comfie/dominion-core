'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, TrendingUp } from 'lucide-react';
import { IncomeSource, incomeSourceConfig } from '@/types/finance';
import { format } from 'date-fns';

interface AddIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddIncomeModal({ isOpen, onClose, onSuccess }: AddIncomeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        source: 'SIDE_HUSTLE' as IncomeSource,
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/incomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add income');
            }

            // Reset form and close
            setFormData({
                name: '',
                amount: '',
                source: 'SIDE_HUSTLE',
                date: format(new Date(), 'yyyy-MM-dd'),
                isRecurring: false,
                notes: '',
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                        Add Income
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Income Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Freelance project, Sold TV"
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Amount & Source */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Amount *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Source *
                                        </label>
                                        <select
                                            value={formData.source}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value as IncomeSource })}
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        >
                                            {Object.entries(incomeSourceConfig).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Date Received *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Is Recurring */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isRecurring"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] text-[var(--dc-primary)] focus:ring-2 focus:ring-[var(--dc-primary)]"
                                    />
                                    <label htmlFor="isRecurring" className="text-sm text-[var(--dc-text-secondary)]">
                                        This is a recurring income (e.g. monthly side gig)
                                    </label>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Any additional details..."
                                        rows={2}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors resize-none"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Add Income'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
