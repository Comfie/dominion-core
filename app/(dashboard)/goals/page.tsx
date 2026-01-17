'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, Target, Calendar, TrendingUp, Check, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SavingsGoal, goalCategoryConfig, GoalCategory } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { differenceInMonths, differenceInDays, format } from 'date-fns';
import { SavingsGoalModal } from '@/components/modals/SavingsGoalModal';
import { AddFundsModal } from '@/components/modals/AddFundsModal';

export default function GoalsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchGoals();
        }
    }, [status, router]);

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/goals');
            if (res.ok) {
                const data = await res.json();
                setGoals(data.map((g: any) => ({
                    ...g,
                    targetDate: g.targetDate ? new Date(g.targetDate) : null,
                    createdAt: new Date(g.createdAt),
                    updatedAt: new Date(g.updatedAt),
                })));
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/goals/${id}`, { method: 'DELETE' });
            setDeleteConfirmId(null);
            fetchGoals();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const getMonthlyNeeded = (goal: SavingsGoal) => {
        if (!goal.targetDate || goal.isCompleted) return null;
        const remaining = goal.targetAmount - goal.currentAmount;
        const monthsLeft = differenceInMonths(new Date(goal.targetDate), new Date());
        if (monthsLeft <= 0) return remaining;
        return remaining / monthsLeft;
    };

    const getTimeRemaining = (goal: SavingsGoal) => {
        if (!goal.targetDate) return null;
        const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
        if (daysLeft < 0) return 'Overdue';
        if (daysLeft === 0) return 'Due today';
        if (daysLeft === 1) return '1 day left';
        if (daysLeft < 30) return `${daysLeft} days left`;
        const months = Math.floor(daysLeft / 30);
        return months === 1 ? '1 month left' : `${months} months left`;
    };

    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--dc-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--dc-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 glass">
                <div className="px-4 py-4 flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-[var(--dc-text-primary)]">
                            Savings Goals
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Track your financial targets
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditGoal(null);
                            setIsGoalModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-[var(--dc-primary)] flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </header>

            <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
                {/* Overall Progress Card */}
                {goals.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--dc-text-muted)]">Total Progress</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatCurrency(totalSaved)}
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-sm text-[var(--dc-text-muted)]">Target</p>
                                <p className="text-lg font-semibold text-[var(--dc-text-primary)]">
                                    {formatCurrency(totalTarget)}
                                </p>
                            </div>
                        </div>

                        {/* Overall progress bar */}
                        <div className="progress-bar mb-2">
                            <motion.div
                                className="progress-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, overallPercentage)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                style={{ background: 'linear-gradient(to right, #22c55e, #14b8a6)' }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-[var(--dc-text-muted)]">
                            <span>{overallPercentage.toFixed(0)}% complete</span>
                            <span>{activeGoals.length} active • {completedGoals.length} completed</span>
                        </div>
                    </motion.div>
                )}

                {/* Active Goals Section */}
                {activeGoals.length > 0 && (
                    <div>
                        <h2 className="text-sm font-medium text-[var(--dc-text-secondary)] mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Active Goals
                        </h2>
                        <div className="space-y-3">
                            {activeGoals.map((goal, index) => {
                                const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                                const monthlyNeeded = getMonthlyNeeded(goal);
                                const timeRemaining = getTimeRemaining(goal);
                                const categoryInfo = goalCategoryConfig[goal.category as GoalCategory];

                                return (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="card p-4"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${goal.color}20` }}
                                                >
                                                    <Target className="w-5 h-5" style={{ color: goal.color }} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--dc-text-primary)]">
                                                        {goal.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)]">
                                                        <span className="px-1.5 py-0.5 rounded bg-[var(--dc-bg-secondary)]">
                                                            {categoryInfo?.label}
                                                        </span>
                                                        {goal.targetDate && (
                                                            <span>Target: {format(new Date(goal.targetDate), 'MMM yyyy')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedGoal(goal);
                                                        setIsAddFundsOpen(true);
                                                    }}
                                                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditGoal(goal);
                                                        setIsGoalModalOpen(true);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-[var(--dc-bg-secondary)] text-[var(--dc-text-muted)]"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(goal.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="progress-bar mb-2">
                                            <motion.div
                                                className="progress-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                                style={{ backgroundColor: goal.color }}
                                            />
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <span className="font-medium text-[var(--dc-text-primary)]">
                                                    {formatCurrency(goal.currentAmount)}
                                                </span>
                                                <span className="text-[var(--dc-text-muted)]">
                                                    {' '}/ {formatCurrency(goal.targetAmount)}
                                                </span>
                                                <span className="ml-2 text-xs" style={{ color: goal.color }}>
                                                    ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[var(--dc-text-muted)]">
                                                {monthlyNeeded && monthlyNeeded > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        {formatCurrency(monthlyNeeded)}/mo needed
                                                    </span>
                                                )}
                                                {timeRemaining && (
                                                    <span className={`flex items-center gap-1 ${timeRemaining === 'Overdue' ? 'text-red-400' : ''}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {timeRemaining}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Completed Goals Section */}
                {completedGoals.length > 0 && (
                    <div>
                        <h2 className="text-sm font-medium text-[var(--dc-text-secondary)] mb-3 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            Completed Goals
                        </h2>
                        <div className="space-y-2">
                            {completedGoals.map((goal) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="card p-4 bg-emerald-500/10 border border-emerald-500/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--dc-text-primary)]">{goal.name}</p>
                                                <p className="text-xs text-emerald-400">
                                                    {formatCurrency(goal.targetAmount)} achieved!
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setDeleteConfirmId(goal.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {goals.length === 0 && (
                    <div className="text-center py-16">
                        <Sparkles className="w-16 h-16 text-[var(--dc-text-muted)] mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-[var(--dc-text-primary)] mb-2">
                            No Savings Goals Yet
                        </h2>
                        <p className="text-[var(--dc-text-muted)] mb-6 max-w-sm mx-auto">
                            Start your financial journey by setting a savings goal. Whether it's for a holiday, emergency fund, or a new car!
                        </p>
                        <button
                            onClick={() => {
                                setEditGoal(null);
                                setIsGoalModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--dc-primary)] text-white font-semibold hover:bg-[var(--dc-primary-dark)] transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Goal
                        </button>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="card p-6 w-full max-w-sm"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-2">
                                        Delete Goal
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-6">
                                        Are you sure you want to delete <span className="font-medium text-[var(--dc-text-primary)]">{goals.find(g => g.id === deleteConfirmId)?.name}</span>?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="flex-1 py-2.5 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deleteConfirmId)}
                                            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Goals Modal */}
            <SavingsGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => {
                    setIsGoalModalOpen(false);
                    setEditGoal(null);
                }}
                onSuccess={fetchGoals}
                editGoal={editGoal}
            />

            {/* Add Funds Modal */}
            <AddFundsModal
                isOpen={isAddFundsOpen}
                onClose={() => {
                    setIsAddFundsOpen(false);
                    setSelectedGoal(null);
                }}
                onSuccess={fetchGoals}
                goal={selectedGoal}
            />
        </div>
    );
}
