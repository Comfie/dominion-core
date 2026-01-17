'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryConfig, Category } from '@/types/finance';

interface CategoryData {
    category: string;
    amount: number;
    percentage: number;
}

interface SpendingChartProps {
    data: CategoryData[];
    total: number;
    className?: string;
}

export function SpendingChart({ data, total, className = '' }: SpendingChartProps) {
    const chartData = data.map(item => ({
        name: categoryConfig[item.category as Category]?.label || item.category,
        value: item.amount,
        color: categoryConfig[item.category as Category]?.color || '#6b7280',
        percentage: item.percentage,
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[var(--dc-bg-card)] border border-[var(--dc-border)] rounded-xl p-3 shadow-lg">
                    <p className="text-sm font-medium text-[var(--dc-text-primary)]">{data.name}</p>
                    <p className="text-sm text-[var(--dc-text-secondary)]">
                        R {data.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-[var(--dc-text-muted)]">
                        {data.percentage.toFixed(1)}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`card p-5 ${className}`}
        >
            <h3 className="text-sm font-medium text-[var(--dc-text-secondary)] mb-4">
                Spending by Category
            </h3>

            <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="w-40 h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-[var(--dc-text-primary)]">
                            R {(total / 1000).toFixed(1)}k
                        </span>
                        <span className="text-xs text-[var(--dc-text-muted)]">Total</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                    {chartData.slice(0, 5).map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex items-center gap-3"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="flex-1 text-sm text-[var(--dc-text-secondary)] truncate">
                                {item.name}
                            </span>
                            <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                                {item.percentage.toFixed(0)}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
