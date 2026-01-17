'use client';

import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Flame } from 'lucide-react';
import { Obligation } from '@/types/finance';
import { formatCurrency, calculateTotalDebt, getDebtPriority, calculatePayoffMonths } from '@/lib/calculations';

interface DebtProgressProps {
    obligations: Obligation[];
    className?: string;
}

export function DebtProgress({ obligations, className = '' }: DebtProgressProps) {
    const totalDebt = calculateTotalDebt(obligations);
    const debtPriority = getDebtPriority(obligations);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`card p-5 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                            Total Debt
                        </h3>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            {debtPriority.length} active accounts
                        </p>
                    </div>
                </div>
            </div>

            {/* Total amount */}
            <motion.div
                className="mb-5"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <span className="text-3xl font-bold text-[var(--dc-text-primary)]">
                    {formatCurrency(totalDebt)}
                </span>
            </motion.div>

            {/* Debt items with progress */}
            <div className="space-y-4">
                {debtPriority.slice(0, 4).map((debt, index) => {
                    // For visualization, assume original balance was 1.2x of current (just for demo)
                    const originalBalance = (debt.totalBalance || 0) * 1.2;
                    const currentBalance = debt.totalBalance || 0;
                    const progressPercent = originalBalance > 0
                        ? ((originalBalance - currentBalance) / originalBalance) * 100
                        : 0;
                    const payoffMonths = calculatePayoffMonths(
                        currentBalance,
                        debt.amount,
                        debt.interestRate || 0
                    );

                    return (
                        <motion.div
                            key={debt.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                                        {debt.name}
                                    </span>
                                    {index === 0 && debt.interestRate && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs">
                                            <Flame className="w-3 h-3" />
                                            Priority
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-[var(--dc-text-secondary)]">
                                    {formatCurrency(currentBalance)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-bar mb-1">
                                <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                    style={{
                                        background: 'var(--dc-gradient-primary)',
                                    }}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-[var(--dc-text-muted)]">
                                <span>{progressPercent.toFixed(0)}% paid off</span>
                                <span>
                                    {debt.interestRate ? `${debt.interestRate}% APR` : ''}
                                    {payoffMonths > 0 && ` • ${payoffMonths} months left`}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* View all link */}
            {debtPriority.length > 4 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full mt-4 py-2 text-sm text-[var(--dc-primary)] hover:text-[var(--dc-primary-dark)] transition-colors"
                >
                    View all {debtPriority.length} debts →
                </motion.button>
            )}
        </motion.div>
    );
}
