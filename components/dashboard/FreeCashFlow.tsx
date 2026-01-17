'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Obligation, Expense, Income } from '@/types/finance';
import { formatCurrency, calculateBurnRate, calculateVariableCosts } from '@/lib/calculations';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface FreeCashFlowProps {
    monthlyIncome: number;
    obligations: Obligation[];
    expenses?: Expense[];
    incomes?: Income[];
    className?: string;
}

export function FreeCashFlow({ monthlyIncome, obligations, expenses = [], incomes = [], className = '' }: FreeCashFlowProps) {
    const [displayAmount, setDisplayAmount] = useState(0);

    const burnRate = calculateBurnRate(obligations);
    const variableCosts = calculateVariableCosts(obligations);

    // Calculate totals from actual expenses and extra income
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExtraIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    // Total income = salary + extra income
    const totalIncome = monthlyIncome + totalExtraIncome;

    // Free cash flow = total income - fixed costs - variable costs (from obligations) - actual expenses
    const freeCashFlow = totalIncome - burnRate - variableCosts - totalExpenses;
    const isPositive = freeCashFlow >= 0;

    // Animated counter effect
    useEffect(() => {
        const duration = 1200;
        const steps = 40;
        const increment = freeCashFlow / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = increment * step;
            setDisplayAmount(current);

            if (step >= steps) {
                clearInterval(timer);
                setDisplayAmount(freeCashFlow);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [freeCashFlow]);

    const savingsRate = totalIncome > 0
        ? ((freeCashFlow / totalIncome) * 100).toFixed(1)
        : '0';

    return (
        <GlassCard
            className={`p-0 ${className}`}
            delay={0.15}
        >
            {/* Gradient header */}
            <div className={`p-5 ${isPositive ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10' : 'bg-gradient-to-br from-red-500/20 to-orange-500/10'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                            <Wallet className={`w-5 h-5 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                                Free Cash Flow
                            </h3>
                            <p className="text-xs text-[var(--dc-text-muted)]">
                                Available for savings
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {savingsRate}%
                    </div>
                </div>

                {/* Main amount */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className={`text-4xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {displayAmount < 0 ? '-' : ''}{formatCurrency(Math.abs(displayAmount))}
                    </span>
                </motion.div>
            </div>

            {/* Breakdown */}
            <div className="p-5 space-y-3">
                {/* Income Section */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--dc-text-muted)]">Salary</span>
                    <span className="text-sm font-semibold text-[var(--dc-text-primary)]">
                        {formatCurrency(monthlyIncome)}
                    </span>
                </div>

                {totalExtraIncome > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--dc-text-muted)]">
                            Extra Income
                            <span className="text-xs ml-1 text-green-400">({incomes.length})</span>
                        </span>
                        <span className="text-sm font-semibold text-green-400">
                            +{formatCurrency(totalExtraIncome)}
                        </span>
                    </div>
                )}

                <div className="h-px bg-[var(--dc-border)]" />

                {/* Expenses Section */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--dc-text-muted)]">Fixed Costs</span>
                    <span className="text-sm text-red-400">
                        -{formatCurrency(burnRate)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--dc-text-muted)]">Variable (Obligations)</span>
                    <span className="text-sm text-amber-400">
                        -{formatCurrency(variableCosts)}
                    </span>
                </div>

                {totalExpenses > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--dc-text-muted)]">
                            Expenses
                            <span className="text-xs ml-1 text-orange-400">({expenses.length})</span>
                        </span>
                        <span className="text-sm text-orange-400">
                            -{formatCurrency(totalExpenses)}
                        </span>
                    </div>
                )}

                <div className="h-px bg-[var(--dc-border)]" />

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--dc-text-secondary)]">Remaining</span>
                    <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(freeCashFlow)}
                    </span>
                </div>
            </div>

            {/* Manage Income Link */}
            {incomes.length > 0 && (
                <div className="px-5 pb-5">
                    <Link
                        href="/income"
                        className="block text-center py-2 px-4 rounded-xl bg-[var(--dc-bg-secondary)] hover:bg-[var(--dc-bg-elevated)] text-sm text-green-400 font-medium transition-colors"
                    >
                        Manage Extra Income →
                    </Link>
                </div>
            )}
        </GlassCard>
    );
}
