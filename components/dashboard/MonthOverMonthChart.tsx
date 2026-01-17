'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthData {
    month: string;
    total: number;
}

interface MonthOverMonthChartProps {
    data: MonthData[];
    changePercentage: number;
    className?: string;
}

export function MonthOverMonthChart({ data, changePercentage, className = '' }: MonthOverMonthChartProps) {
    const isPositiveChange = changePercentage >= 0;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--dc-bg-card)] border border-[var(--dc-border)] rounded-xl p-3 shadow-lg">
                    <p className="text-sm font-medium text-[var(--dc-text-primary)]">{label}</p>
                    <p className="text-sm text-[var(--dc-text-secondary)]">
                        R {payload[0].value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    const maxValue = Math.max(...data.map(d => d.total));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`card p-5 ${className}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[var(--dc-text-secondary)]">
                    Monthly Spending Trend
                </h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isPositiveChange
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    {isPositiveChange ? (
                        <TrendingUp className="w-3 h-3" />
                    ) : (
                        <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(changePercentage).toFixed(1)}%
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--dc-border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'var(--dc-text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'var(--dc-border)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'var(--dc-text-muted)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            domain={[0, maxValue * 1.1]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
                        <Bar
                            dataKey="total"
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
