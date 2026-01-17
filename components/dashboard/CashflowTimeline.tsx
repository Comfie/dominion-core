'use client';

import { motion } from 'framer-motion';
import { Calendar, Check, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { UpcomingPayment, categoryConfig, Expense } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { format, isToday, isTomorrow, compareAsc } from 'date-fns';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface TimelineItem {
    type: 'payment' | 'expense';
    date: Date;
    data: UpcomingPayment | Expense;
}

interface CashflowTimelineProps {
    upcomingPayments: UpcomingPayment[];
    expenses?: Expense[];
    payday: number;
    className?: string;
}

export function CashflowTimeline({ upcomingPayments, expenses = [], payday, className = '' }: CashflowTimelineProps) {
    // Combine payments and expenses into a single timeline
    const timelineItems: TimelineItem[] = [
        ...upcomingPayments.map(p => ({
            type: 'payment' as const,
            date: p.dueDate,
            data: p,
        })),
        ...expenses.map(e => ({
            type: 'expense' as const,
            date: e.date,
            data: e,
        })),
    ].sort((a, b) => compareAsc(a.date, b.date));

    // Group payments by their relative timing
    const getDateLabel = (date: Date): string => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'EEE d MMM');
    };

    const getPaymentStatusIcon = (payment: UpcomingPayment) => {
        if (payment.isPaid) {
            return <Check className="w-4 h-4 text-green-400" />;
        }
        if (payment.daysUntil <= 0) {
            return <AlertCircle className="w-4 h-4 text-red-400" />;
        }
        if (payment.daysUntil <= 3) {
            return <Clock className="w-4 h-4 text-amber-400" />;
        }
        return <Clock className="w-4 h-4 text-[var(--dc-text-muted)]" />;
    };

    return (
        <GlassCard
            className={`p-5 ${className}`}
            delay={0.3}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                            Cashflow Timeline
                        </h3>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Payday cycle: {payday}th to {payday}th
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-[var(--dc-border)]" />

                {/* Timeline items */}
                <div className="space-y-4">
                    {timelineItems.slice(0, 8).map((item, index) => {
                        if (item.type === 'payment') {
                            const payment = item.data as UpcomingPayment;
                            const config = categoryConfig[payment.obligation.category];
                            const isOverdue = payment.daysUntil < 0 && !payment.isPaid;

                            return (
                                <motion.div
                                    key={`payment-${payment.obligation.id}`}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 + index * 0.08 }}
                                    className="relative flex items-start gap-4 pl-8"
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={`absolute left-0 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center
                    ${payment.isPaid
                                                ? 'bg-green-500/20 border-green-500'
                                                : isOverdue
                                                    ? 'bg-red-500/20 border-red-500'
                                                    : 'bg-[var(--dc-bg-card)] border-[var(--dc-border)]'
                                            }`}
                                    >
                                        {getPaymentStatusIcon(payment)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pb-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-0.5">
                                                    {getDateLabel(payment.dueDate)}
                                                </p>
                                                <p className={`text-sm font-medium truncate ${payment.isPaid
                                                    ? 'text-[var(--dc-text-muted)] line-through'
                                                    : 'text-[var(--dc-text-primary)]'
                                                    }`}>
                                                    {payment.obligation.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: config.color }}
                                                    />
                                                    <span className="text-xs text-[var(--dc-text-muted)]">
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-sm font-semibold ${payment.isPaid
                                                    ? 'text-[var(--dc-text-muted)]'
                                                    : isOverdue
                                                        ? 'text-red-400'
                                                        : 'text-[var(--dc-text-primary)]'
                                                    }`}>
                                                    {formatCurrency(payment.obligation.amount)}
                                                </p>
                                                {payment.isPaid && (
                                                    <span className="text-xs text-green-400">Paid</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        } else {
                            // Expense item
                            const expense = item.data as Expense;
                            const config = categoryConfig[expense.category];

                            return (
                                <motion.div
                                    key={`expense-${expense.id}`}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 + index * 0.08 }}
                                    className="relative flex items-start gap-4 pl-8"
                                >
                                    {/* Timeline dot - orange for expenses */}
                                    <div className="absolute left-0 w-[30px] h-[30px] rounded-full border-2 bg-orange-500/20 border-orange-500 flex items-center justify-center">
                                        <ShoppingBag className="w-4 h-4 text-orange-400" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pb-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs text-[var(--dc-text-muted)] mb-0.5">
                                                    {getDateLabel(expense.date)}
                                                </p>
                                                <p className="text-sm font-medium truncate text-[var(--dc-text-primary)]">
                                                    {expense.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: config.color }}
                                                    />
                                                    <span className="text-xs text-[var(--dc-text-muted)]">
                                                        {config.label}
                                                    </span>
                                                    {expense.person && (
                                                        <span className="text-xs text-purple-400">• {expense.person.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-semibold text-orange-400">
                                                    -{formatCurrency(expense.amount)}
                                                </p>
                                                <span className="text-xs text-[var(--dc-text-muted)]">Expense</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }
                    })}
                </div>

                {/* End marker - Next payday */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="relative flex items-center gap-4 pl-8"
                >
                    <div className="absolute left-0 w-[30px] h-[30px] rounded-full bg-[var(--dc-primary)] flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{payday}</span>
                    </div>
                    <div className="py-2 px-3 rounded-lg bg-[var(--dc-primary)]/10">
                        <p className="text-sm font-medium text-[var(--dc-primary)]">
                            Next Payday
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* View All Link */}
            {expenses.length > 0 && (
                <Link
                    href="/expenses"
                    className="block mt-4 text-center py-2 px-4 rounded-xl bg-[var(--dc-bg-secondary)] hover:bg-[var(--dc-bg-elevated)] text-sm text-[var(--dc-primary)] font-medium transition-colors"
                >
                    View All Expenses →
                </Link>
            )}
        </GlassCard>
    );
}
