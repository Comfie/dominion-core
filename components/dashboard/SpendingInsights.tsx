'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Info, Lightbulb } from 'lucide-react';

interface Insight {
    type: 'increase' | 'decrease' | 'info' | 'warning';
    message: string;
    category?: string;
    change?: number;
}

interface SpendingInsightsProps {
    insights: Insight[];
    avgDailySpending: number;
    className?: string;
}

const insightConfig = {
    increase: {
        icon: TrendingUp,
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
    },
    decrease: {
        icon: TrendingDown,
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        iconColor: 'text-emerald-400',
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
    },
    warning: {
        icon: AlertCircle,
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
    },
};

export function SpendingInsights({ insights, avgDailySpending, className = '' }: SpendingInsightsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`card p-5 ${className}`}
        >
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                    Spending Insights
                </h3>
            </div>

            {/* Average daily spending */}
            <div className="mb-4 p-3 rounded-xl bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)]">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--dc-text-muted)]">Average daily spending</span>
                    <span className="text-lg font-bold text-[var(--dc-text-primary)]">
                        R {avgDailySpending.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Insights list */}
            <div className="space-y-3">
                {insights.length > 0 ? (
                    insights.map((insight, index) => {
                        const config = insightConfig[insight.type];
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`flex items-start gap-3 p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}
                            >
                                <div className={`mt-0.5 ${config.iconColor}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-sm text-[var(--dc-text-primary)] flex-1">
                                    {insight.message}
                                </p>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-4 text-sm text-[var(--dc-text-muted)]">
                        Add more expenses to see personalized insights
                    </div>
                )}
            </div>
        </motion.div>
    );
}
