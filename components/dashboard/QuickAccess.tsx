'use client';

import { motion } from 'framer-motion';
import { Target, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface QuickAccessProps {
    className?: string;
}

export function QuickAccess({ className = '' }: QuickAccessProps) {
    const quickLinks = [
        {
            icon: Target,
            label: 'Savings Goals',
            description: 'Track your financial targets',
            href: '/goals',
            color: '#22c55e',
            gradient: 'from-emerald-500/20 to-teal-500/20',
        },
        {
            icon: BarChart3,
            label: 'Spending Insights',
            description: 'Analyze your spending patterns',
            href: '/insights',
            color: '#8b5cf6',
            gradient: 'from-purple-500/20 to-indigo-500/20',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`grid grid-cols-2 gap-3 ${className}`}
        >
            {quickLinks.map((link, index) => (
                <Link key={link.href} href={link.href}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className={`card p-4 bg-gradient-to-br ${link.gradient} hover:scale-[1.02] transition-transform cursor-pointer group`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${link.color}30` }}
                            >
                                <link.icon className="w-5 h-5" style={{ color: link.color }} />
                            </div>
                            <ChevronRight
                                className="w-5 h-5 text-[var(--dc-text-muted)] group-hover:text-[var(--dc-text-secondary)] transition-colors group-hover:translate-x-0.5 transform"
                            />
                        </div>
                        <h3 className="text-sm font-medium text-[var(--dc-text-primary)] mb-0.5">
                            {link.label}
                        </h3>
                        <p className="text-xs text-[var(--dc-text-muted)] line-clamp-1">
                            {link.description}
                        </p>
                    </motion.div>
                </Link>
            ))}
        </motion.div>
    );
}
