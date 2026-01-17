'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Target } from 'lucide-react';
import { GoalCategory, goalCategoryConfig, SavingsGoal } from '@/types/finance';
import { format, addMonths } from 'date-fns';

interface SavingsGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editGoal?: SavingsGoal | null;
}

const colorOptions = [
    '#8B5CF6', // Purple (default)
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6366f1', // Indigo
];

export function SavingsGoalModal({ isOpen, onClose, onSuccess, editGoal }: SavingsGoalModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
        category: 'OTHER' as GoalCategory,
        color: '#8B5CF6',
    });

    // Pre-fill form when editing
    useEffect(() => {
        if (isOpen && editGoal) {
            setFormData({
                name: editGoal.name,
                targetAmount: editGoal.targetAmount.toString(),
                currentAmount: editGoal.currentAmount.toString(),
                targetDate: editGoal.targetDate ? format(new Date(editGoal.targetDate), 'yyyy-MM-dd') : '',
                category: editGoal.category,
                color: editGoal.color,
            });
        } else if (isOpen && !editGoal) {
            // Reset form for new goal
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '',
                targetDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
                category: 'OTHER',
                color: '#8B5CF6',
            });
        }
    }, [isOpen, editGoal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const url = editGoal ? `/api/goals/${editGoal.id}` : '/api/goals';
            const method = editGoal ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    targetAmount: parseFloat(formData.targetAmount),
                    currentAmount: parseFloat(formData.currentAmount) || 0,
                    targetDate: formData.targetDate || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save goal');
            }

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
                            className="card w-full max-w-md max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--dc-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--dc-text-primary)]">
                                        {editGoal ? 'Edit Goal' : 'New Savings Goal'}
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
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Goal Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Holiday Fund, Emergency Fund"
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        required
                                    />
                                </div>

                                {/* Target Amount & Category */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Target Amount *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.targetAmount}
                                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                            placeholder="15000"
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        >
                                            {Object.entries(goalCategoryConfig).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Current Amount & Target Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Already Saved
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.currentAmount}
                                            onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                            Target Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.targetDate}
                                            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                                            className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                        Color
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-8 h-8 rounded-full transition-all ${formData.color === color
                                                        ? 'ring-2 ring-offset-2 ring-offset-[var(--dc-bg-primary)] ring-white scale-110'
                                                        : 'hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Error */}
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
                                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            editGoal ? 'Save Changes' : 'Create Goal'
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
