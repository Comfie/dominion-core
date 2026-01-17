'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Coins } from 'lucide-react';
import { SavingsGoal } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal: SavingsGoal | null;
}

const quickAmounts = [100, 500, 1000, 2500, 5000];

export function AddFundsModal({ isOpen, onClose, onSuccess, goal }: AddFundsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [amount, setAmount] = useState('');

    if (!goal) return null;

    const remaining = goal.targetAmount - goal.currentAmount;
    const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`/api/goals/${goal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    addFunds: parseFloat(amount),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add funds');
            }

            setAmount('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
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
                            className="card p-6 w-full max-w-sm"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${goal.color}20` }}
                                    >
                                        <Coins className="w-5 h-5" style={{ color: goal.color }} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--dc-text-primary)]">
                                            Add Funds
                                        </h2>
                                        <p className="text-sm text-[var(--dc-text-muted)]">
                                            {goal.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="mb-5 p-3 rounded-xl bg-[var(--dc-bg-secondary)]">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-[var(--dc-text-muted)]">Progress</span>
                                    <span className="text-[var(--dc-text-primary)]">{percentage.toFixed(0)}%</span>
                                </div>
                                <div className="progress-bar mb-2">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: goal.color,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-[var(--dc-text-muted)]">
                                    <span>{formatCurrency(goal.currentAmount)}</span>
                                    <span>{formatCurrency(goal.targetAmount)}</span>
                                </div>
                            </div>

                            {/* Quick amounts */}
                            <div className="mb-4">
                                <p className="text-xs text-[var(--dc-text-muted)] mb-2">Quick add</p>
                                <div className="flex gap-2 flex-wrap">
                                    {quickAmounts.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => handleQuickAmount(value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${amount === value.toString()
                                                    ? 'bg-[var(--dc-primary)] text-white'
                                                    : 'bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-elevated)]'
                                                }`}
                                        >
                                            R{value.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Custom Amount */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Amount to add
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors text-lg font-medium"
                                        required
                                    />
                                    {remaining > 0 && (
                                        <p className="text-xs text-[var(--dc-text-muted)] mt-1">
                                            {formatCurrency(remaining)} remaining to reach your goal
                                        </p>
                                    )}
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-semibold hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !amount}
                                        className="flex-1 py-3 px-4 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: `linear-gradient(to right, ${goal.color}, ${goal.color}cc)` }}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Add Funds
                                            </>
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
