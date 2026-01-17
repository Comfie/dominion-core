'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Loader2, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { MonthOverMonthChart } from '@/components/dashboard/MonthOverMonthChart';
import { SpendingInsights } from '@/components/dashboard/SpendingInsights';
import { formatCurrency } from '@/lib/calculations';
import { format, subMonths, addMonths, isSameMonth } from 'date-fns';

interface SpendingAnalytics {
    currentMonth: {
        total: number;
        categoryBreakdown: Record<string, number>;
        transactionCount: number;
    };
    previousMonth: {
        total: number;
        categoryBreakdown: Record<string, number>;
        transactionCount: number;
    };
    monthOverMonthChange: number;
    monthlyData: Array<{
        month: string;
        total: number;
        categoryBreakdown: Record<string, number>;
    }>;
    insights: Array<{
        type: 'increase' | 'decrease' | 'info' | 'warning';
        message: string;
        category?: string;
        change?: number;
    }>;
    avgDailySpending: number;
    topCategories: Array<{
        category: string;
        amount: number;
        percentage: number;
    }>;
}

export default function InsightsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const isCurrentMonth = isSameMonth(selectedMonth, new Date());

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchAnalytics();
        }
    }, [status, router, selectedMonth]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const monthParam = format(selectedMonth, 'yyyy-MM');
            const res = await fetch(`/api/analytics/spending?months=6&targetMonth=${monthParam}`);
            if (!res.ok) {
                throw new Error('Failed to fetch analytics');
            }
            const data = await res.json();
            setAnalytics(data);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching analytics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--dc-primary)] mx-auto mb-4" />
                    <p className="text-[var(--dc-text-muted)]">Loading insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--dc-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-40 glass">
                <div className="px-4 py-4 flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-[var(--dc-text-primary)]">
                            Spending Insights
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Analyze your spending patterns
                        </p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center hover:bg-[var(--dc-bg-secondary)] transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 text-[var(--dc-text-secondary)] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Month Selector */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                        className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center hover:bg-[var(--dc-bg-secondary)] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--dc-bg-card)]">
                        <Calendar className="w-4 h-4 text-[var(--dc-primary)]" />
                        <span className="text-[var(--dc-text-primary)] font-medium min-w-[120px] text-center">
                            {format(selectedMonth, 'MMMM yyyy')}
                        </span>
                    </div>
                    <button
                        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                        disabled={isCurrentMonth}
                        className={`w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center transition-colors ${isCurrentMonth ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--dc-bg-secondary)]'}`}
                    >
                        <ChevronRight className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </button>
                </div>
            </div>

            <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
                {error ? (
                    <div className="card p-6 text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={fetchAnalytics}
                            className="px-4 py-2 rounded-xl bg-[var(--dc-primary)] text-white"
                        >
                            Try Again
                        </button>
                    </div>
                ) : analytics ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card p-4"
                            >
                                <p className="text-xs text-[var(--dc-text-muted)] mb-1">
                                    {isCurrentMonth ? 'This Month' : format(selectedMonth, 'MMM yyyy')}
                                </p>
                                <p className="text-xl font-bold text-[var(--dc-text-primary)]">
                                    {formatCurrency(analytics.currentMonth.total)}
                                </p>
                                <p className="text-xs text-[var(--dc-text-muted)]">
                                    {analytics.currentMonth.transactionCount} transactions
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="card p-4"
                            >
                                <p className="text-xs text-[var(--dc-text-muted)] mb-1">
                                    vs {format(subMonths(selectedMonth, 1), 'MMM')}
                                </p>
                                <p className={`text-xl font-bold ${analytics.monthOverMonthChange >= 0
                                    ? 'text-red-400'
                                    : 'text-emerald-400'
                                    }`}>
                                    {analytics.monthOverMonthChange >= 0 ? '+' : ''}
                                    {analytics.monthOverMonthChange.toFixed(1)}%
                                </p>
                                <p className="text-xs text-[var(--dc-text-muted)]">
                                    {analytics.monthOverMonthChange >= 0 ? 'More spending' : 'Less spending'}
                                </p>
                            </motion.div>
                        </div>

                        {/* Charts */}
                        {analytics.topCategories.length > 0 ? (
                            <>
                                <SpendingChart
                                    data={analytics.topCategories}
                                    total={analytics.currentMonth.total}
                                />

                                <MonthOverMonthChart
                                    data={analytics.monthlyData}
                                    changePercentage={analytics.monthOverMonthChange}
                                />

                                <SpendingInsights
                                    insights={analytics.insights}
                                    avgDailySpending={analytics.avgDailySpending}
                                />
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="card p-8 text-center"
                            >
                                <BarChart3 className="w-16 h-16 text-[var(--dc-text-muted)] mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-[var(--dc-text-primary)] mb-2">
                                    No Spending Data Yet
                                </h2>
                                <p className="text-[var(--dc-text-muted)] mb-6 max-w-sm mx-auto">
                                    Start tracking your expenses to see detailed insights and trends.
                                </p>
                                <Link
                                    href="/expenses"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--dc-primary)] text-white font-semibold hover:bg-[var(--dc-primary-dark)] transition-colors"
                                >
                                    Add Your First Expense
                                </Link>
                            </motion.div>
                        )}
                    </>
                ) : null}
            </main>
        </div>
    );
}
