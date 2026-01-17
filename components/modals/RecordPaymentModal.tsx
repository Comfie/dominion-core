'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Obligation } from '@/types/finance';
import { format } from 'date-fns';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    obligation: Obligation | null;
}

const adjustmentReasons = [
    { value: '', label: 'No adjustment' },
    { value: 'DISCOUNT', label: 'Discount received' },
    { value: 'INCREASE', label: 'Amount increased' },
    { value: 'DECREASE', label: 'Amount decreased' },
    { value: 'PARTIAL', label: 'Partial payment' },
    { value: 'ERROR', label: 'Correction/Error' },
];

export function RecordPaymentModal({ isOpen, onClose, onSuccess, obligation }: RecordPaymentModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasAdjustment, setHasAdjustment] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        expectedAmount: '',
        adjustmentReason: '',
        paidAt: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
    });

    // Update form when obligation changes
    useEffect(() => {
        if (obligation) {
            const amt = obligation.amount.toString();
            setFormData({
                amount: amt,
                expectedAmount: amt,
                adjustmentReason: '',
                paidAt: format(new Date(), 'yyyy-MM-dd'),
                notes: '',
            });
            setHasAdjustment(false);
        }
    }, [obligation]);

    // Calculate difference
    const expectedAmount = parseFloat(formData.expectedAmount) || 0;
    const actualAmount = parseFloat(formData.amount) || 0;
    const difference = actualAmount - expectedAmount;
    const hasDifference = hasAdjustment && difference !== 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!obligation) return;

        setError('');
        setIsLoading(true);

        try {
            const paidAtDate = new Date(formData.paidAt);
            const month = format(paidAtDate, 'yyyy-MM');

            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obligationId: obligation.id,
                    amount: actualAmount,
                    expectedAmount: hasAdjustment ? expectedAmount : null,
                    adjustmentReason: hasAdjustment && formData.adjustmentReason ? formData.adjustmentReason : null,
                    paidAt: paidAtDate.toISOString(),
                    month,
                    notes: formData.notes || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to record payment');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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
                            className="card w-full max-w-md max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--dc-border)]">
                                <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                    Record Payment
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center justify-center hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {/* Obligation Info */}
                                    <div className="p-4 rounded-xl bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)]">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-[var(--dc-text-muted)] mb-1">Obligation</p>
                                                <p className="text-lg font-semibold text-[var(--dc-text-primary)]">
                                                    {obligation.name}
                                                </p>
                                                <p className="text-sm text-[var(--dc-text-secondary)]">
                                                    {obligation.provider}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[var(--dc-text-muted)]">Expected</p>
                                                <p className="text-lg font-bold text-[var(--dc-text-primary)]">
                                                    R {obligation.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                {/* Amount - readonly if no adjustment */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Amount Paid *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        readOnly={!hasAdjustment}
                                        className={`w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors ${!hasAdjustment ? 'opacity-75 cursor-not-allowed' : ''}`}
                                        required
                                    />
                                </div>

                                {/* Adjustment Toggle */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="hasAdjustment"
                                        checked={hasAdjustment}
                                        onChange={(e) => {
                                            setHasAdjustment(e.target.checked);
                                            if (!e.target.checked) {
                                                // Reset to expected amount
                                                setFormData({
                                                    ...formData,
                                                    amount: formData.expectedAmount,
                                                    adjustmentReason: '',
                                                });
                                            }
                                        }}
                                        className="w-5 h-5 rounded bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] text-[var(--dc-primary)] focus:ring-2 focus:ring-[var(--dc-primary)]"
                                    />
                                    <label htmlFor="hasAdjustment" className="text-sm text-[var(--dc-text-secondary)]">
                                        Amount is different from expected
                                    </label>
                                </div>

                                {/* Adjustment Details */}
                                {hasAdjustment && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        {/* Adjustment Reason */}
                                        <div>
                                            <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                                Reason for Adjustment
                                            </label>
                                            <select
                                                value={formData.adjustmentReason}
                                                onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            >
                                                {adjustmentReasons.map((reason) => (
                                                    <option key={reason.value} value={reason.value}>
                                                        {reason.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Difference Display */}
                                        {hasDifference && (
                                            <div className={`p-3 rounded-lg flex items-center gap-2 ${difference > 0 ? 'bg-red-500/20 border border-red-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
                                                <AlertCircle className={`w-5 h-5 ${difference > 0 ? 'text-red-400' : 'text-green-400'}`} />
                                                <span className={`text-sm ${difference > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {difference > 0 ? 'Paying' : 'Saving'} R {Math.abs(difference).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} {difference > 0 ? 'more' : 'less'} than expected
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Payment Date */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Payment Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.paidAt}
                                        onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Add any notes about this payment..."
                                        rows={2}
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors resize-none"
                                    />
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                </div>

                                {/* Actions - Fixed at bottom */}
                                <div className="flex gap-3 p-6 pt-4 border-t border-[var(--dc-border)]">
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
                                            <>
                                                <Check className="w-5 h-5" />
                                                Record Payment
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
