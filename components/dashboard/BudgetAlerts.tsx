'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Expense, Person, Settings } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';

interface BudgetAlert {
    type: 'warning' | 'exceeded';
    name: string; // "Global" or person name
    spent: number;
    budget: number;
    percentage: number;
}

interface BudgetAlertsProps {
    expenses: Expense[];
    persons: Person[];
    settings: Settings | null;
    className?: string;
}

export function BudgetAlerts({ expenses, persons, settings, className = '' }: BudgetAlertsProps) {
    const alerts: BudgetAlert[] = [];

    // Calculate total expenses for current month
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Check global budget
    if (settings?.monthlyBudget && settings.monthlyBudget > 0) {
        const percentage = (totalSpent / settings.monthlyBudget) * 100;
        if (percentage >= 80) {
            alerts.push({
                type: percentage >= 100 ? 'exceeded' : 'warning',
                name: 'Global Budget',
                spent: totalSpent,
                budget: settings.monthlyBudget,
                percentage,
            });
        }
    }

    // Check per-person budgets
    persons.forEach((person) => {
        if (person.budgetLimit && person.budgetLimit > 0) {
            const personExpenses = expenses
                .filter((e) => e.personId === person.id)
                .reduce((sum, e) => sum + e.amount, 0);
            const percentage = (personExpenses / person.budgetLimit) * 100;
            if (percentage >= 80) {
                alerts.push({
                    type: percentage >= 100 ? 'exceeded' : 'warning',
                    name: person.name,
                    spent: personExpenses,
                    budget: person.budgetLimit,
                    percentage,
                });
            }
        }
    });

    if (alerts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-2 ${className}`}
        >
            {alerts.map((alert, index) => (
                <motion.div
                    key={`${alert.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border ${alert.type === 'exceeded'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.type === 'exceeded' ? 'bg-red-500/20' : 'bg-amber-500/20'
                                }`}
                        >
                            {alert.type === 'exceeded' ? (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p
                                    className={`font-medium ${alert.type === 'exceeded' ? 'text-red-400' : 'text-amber-400'
                                        }`}
                                >
                                    {alert.type === 'exceeded' ? 'Budget Exceeded' : 'Budget Warning'}
                                </p>
                                <span
                                    className={`text-sm font-bold ${alert.type === 'exceeded' ? 'text-red-400' : 'text-amber-400'
                                        }`}
                                >
                                    {Math.round(alert.percentage)}%
                                </span>
                            </div>
                            <p className="text-sm text-[var(--dc-text-muted)] mt-1">
                                {alert.name}: {formatCurrency(alert.spent)} of {formatCurrency(alert.budget)}
                            </p>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 bg-[var(--dc-bg-secondary)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${alert.type === 'exceeded'
                                            ? 'bg-red-500'
                                            : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
            <Link
                href="/settings"
                className="block text-center text-xs text-[var(--dc-text-muted)] hover:text-[var(--dc-primary)] transition-colors"
            >
                Manage budget alerts in Settings
            </Link>
        </motion.div>
    );
}
