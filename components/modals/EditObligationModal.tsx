'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Category, categoryConfig, Obligation } from '@/types/finance';

interface EditObligationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    obligation: Obligation | null;
}

export function EditObligationModal({ isOpen, onClose, onSuccess, obligation }: EditObligationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: obligation?.name || '',
        provider: obligation?.provider || '',
        category: (obligation?.category || 'HOUSING') as Category,
        amount: obligation?.amount?.toString() || '',
        totalBalance: obligation?.totalBalance?.toString() || '',
        interestRate: obligation?.interestRate?.toString() || '',
        debitOrderDate: obligation?.debitOrderDate?.toString() || '1',
        isUncompromised: obligation?.isUncompromised ?? true,
        notes: obligation?.notes || '',
    });

    // Update form when obligation changes
    useEffect(() => {
        if (obligation) {
            setFormData({
                name: obligation.name,
                provider: obligation.provider,
                category: obligation.category,
                amount: obligation.amount.toString(),
                totalBalance: obligation.totalBalance?.toString() || '',
                interestRate: obligation.interestRate?.toString() || '',
                debitOrderDate: obligation.debitOrderDate.toString(),
                isUncompromised: obligation.isUncompromised,
                notes: obligation.notes || '',
            });
        }
    }, [obligation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!obligation) return;

        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`/api/obligations/${obligation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    totalBalance: formData.totalBalance ? parseFloat(formData.totalBalance) : null,
                    interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
                    debitOrderDate: parseInt(formData.debitOrderDate),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update obligation');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!obligation || !confirm('Are you sure you want to delete this obligation? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const res = await fetch(`/api/obligations/${obligation.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete obligation');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!obligation) return null;

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
                            className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                    Edit Obligation
                                </h2>
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
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Provider */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Provider *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.provider}
                                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Category & Amount */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Category *
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        >
                                            {Object.entries(categoryConfig).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Monthly Amount *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Debit Order Date */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Debit Order Date *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.debitOrderDate}
                                        onChange={(e) => setFormData({ ...formData, debitOrderDate: e.target.value })}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Total Balance & Interest Rate (for debt) */}
                                {formData.category === 'DEBT' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                                Total Balance
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.totalBalance}
                                                onChange={(e) => setFormData({ ...formData, totalBalance: e.target.value })}
                                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                                Interest Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.interestRate}
                                                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Is Uncompromised */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isUncompromised"
                                        checked={formData.isUncompromised}
                                        onChange={(e) => setFormData({ ...formData, isUncompromised: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] text-[var(--dc-primary)] focus:ring-2 focus:ring-[var(--dc-primary)]"
                                    />
                                    <label htmlFor="isUncompromised" className="text-sm text-[var(--dc-text-secondary)]">
                                        This is an uncompromised cost
                                    </label>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors resize-none"
                                    />
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting || isLoading}
                                        className="py-3 px-4 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="w-5 h-5" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || isDeleting}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--dc-primary)] to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Save Changes'
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
