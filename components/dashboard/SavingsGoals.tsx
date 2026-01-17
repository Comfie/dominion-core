'use client';

import { motion } from 'framer-motion';
import { Target, Plus, Calendar, TrendingUp, Check, Sparkles } from 'lucide-react';
import { SavingsGoal, goalCategoryConfig, GoalCategory } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { differenceInMonths, differenceInDays, format } from 'date-fns';
import Link from 'next/link';

interface SavingsGoalsProps {
    goals: SavingsGoal[];
    className?: string;
    onAddFunds?: (goal: SavingsGoal) => void;
}

export function SavingsGoals({ goals, className = '', onAddFunds }: SavingsGoalsProps) {
    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    const getProgressColor = (percentage: number, goalColor: string) => {
        if (percentage >= 100) return '#22c55e';
        if (percentage >= 75) return goalColor;
        if (percentage >= 50) return goalColor;
        return goalColor;
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={`card p-5 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                            Savings Goals
                        </h3>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            {activeGoals.length} active • {completedGoals.length} completed
                        </p>
                    </div>
                </div>
                <Link
                    href="/goals"
                    className="p-2 rounded-lg bg-[var(--dc-card-bg)] hover:bg-[var(--dc-primary)]/20 transition-colors"
                >
                    <Plus className="w-4 h-4 text-[var(--dc-primary)]" />
                </Link>
            </div>

            {/* Overall Progress */}
            {goals.length > 0 && (
                <motion.div
                    className="mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--dc-text-muted)]">Total Saved</span>
                        <span className="text-xs text-emerald-400">
                            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[var(--dc-text-primary)]">
                            {formatCurrency(totalSaved)}
                        </span>
                        <span className="text-sm text-[var(--dc-text-muted)]">
                            / {formatCurrency(totalTarget)}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Goals List */}
            <div className="space-y-4">
                {activeGoals.length === 0 && completedGoals.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6"
                    >
                        <Sparkles className="w-10 h-10 mx-auto mb-3 text-[var(--dc-text-muted)]" />
                        <p className="text-sm text-[var(--dc-text-muted)] mb-3">
                            No savings goals yet
                        </p>
                        <Link
                            href="/goals"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--dc-primary)] text-white text-sm font-medium hover:bg-[var(--dc-primary-dark)] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Goal
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {activeGoals.slice(0, 3).map((goal, index) => {
                            const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                            const monthlyNeeded = getMonthlyNeeded(goal);
                            const timeRemaining = getTimeRemaining(goal);
                            const categoryInfo = goalCategoryConfig[goal.category as GoalCategory];

                            return (
                                <motion.div
                                    key={goal.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: goal.color }}
                                            />
                                            <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                                                {goal.name}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--dc-card-bg)] text-[var(--dc-text-muted)]">
                                                {categoryInfo?.label || goal.category}
                                            </span>
                                        </div>
                                        {onAddFunds && (
                                            <button
                                                onClick={() => onAddFunds(goal)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 transition-all hover:bg-emerald-500/30"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="progress-bar mb-2">
                                        <motion.div
                                            className="progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                            style={{
                                                backgroundColor: getProgressColor(percentage, goal.color),
                                            }}
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[var(--dc-text-muted)]">
                                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                            <span className="ml-1 text-emerald-400">({percentage.toFixed(0)}%)</span>
                                        </span>
                                        <div className="flex items-center gap-3 text-[var(--dc-text-muted)]">
                                            {monthlyNeeded && monthlyNeeded > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {formatCurrency(monthlyNeeded)}/mo
                                                </span>
                                            )}
                                            {timeRemaining && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {timeRemaining}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Completed Goals Preview */}
                        {completedGoals.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="pt-3 border-t border-[var(--dc-border)]"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-emerald-400 font-medium">
                                        {completedGoals.length} goal{completedGoals.length > 1 ? 's' : ''} achieved!
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* View All Link */}
            {goals.length > 3 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4 text-center"
                >
                    <Link
                        href="/goals"
                        className="text-sm text-[var(--dc-primary)] hover:text-[var(--dc-primary-dark)] transition-colors"
                    >
                        View all {goals.length} goals →
                    </Link>
                </motion.div>
            )}
        </motion.div>
    );
}
