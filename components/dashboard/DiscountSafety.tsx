'use client';

import { motion } from 'framer-motion';
import { Check, AlertTriangle, Clock, X } from 'lucide-react';
import { DiscountStatus } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';

interface DiscountSafetyProps {
    status: DiscountStatus;
    className?: string;
}

export function DiscountSafety({ status, className = '' }: DiscountSafetyProps) {
    const { isSecured, levyAmount, paidDate, dueDate, daysRemaining } = status;

    // Determine status color and animation
    const getStatusConfig = () => {
        if (isSecured) {
            return {
                bgClass: 'bg-green-500/20 border-green-500/50',
                iconBg: 'bg-green-500',
                pulseClass: 'pulse-success',
                icon: Check,
                title: 'Discount Secured',
                subtitle: paidDate
                    ? `Paid on ${new Date(paidDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}`
                    : 'Payment confirmed',
            };
        }

        if (daysRemaining <= 3) {
            return {
                bgClass: 'bg-red-500/20 border-red-500/50',
                iconBg: 'bg-red-500',
                pulseClass: 'pulse-danger',
                icon: AlertTriangle,
                title: 'Urgent: Pay Now',
                subtitle: daysRemaining === 0 ? 'Due today!' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`,
            };
        }

        if (daysRemaining <= 7) {
            return {
                bgClass: 'bg-amber-500/20 border-amber-500/50',
                iconBg: 'bg-amber-500',
                pulseClass: 'pulse-warning',
                icon: Clock,
                title: 'Payment Due Soon',
                subtitle: `${daysRemaining} days remaining`,
            };
        }

        return {
            bgClass: 'bg-[var(--dc-bg-card)] border-[var(--dc-border)]',
            iconBg: 'bg-[var(--dc-primary)]',
            pulseClass: '',
            icon: Clock,
            title: 'Payment Pending',
            subtitle: `Due in ${daysRemaining} days`,
        };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`card ${config.bgClass} p-5 ${className}`}
        >
            <div className="flex items-center gap-4">
                {/* Status indicator with pulse */}
                <div className={`relative flex-shrink-0`}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className={`w-14 h-14 rounded-full ${config.iconBg} ${config.pulseClass} flex items-center justify-center`}
                    >
                        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)]">
                        {config.title}
                    </h3>
                    <p className="text-sm text-[var(--dc-text-secondary)]">
                        {config.subtitle}
                    </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-bold text-[var(--dc-text-primary)]"
                    >
                        {formatCurrency(levyAmount)}
                    </motion.p>
                    <p className="text-xs text-[var(--dc-text-muted)]">Whitfield Levies</p>
                </div>
            </div>

            {/* Next due date */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 pt-4 border-t border-[var(--dc-border)]"
            >
                <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--dc-text-muted)]">Next payment due</span>
                    <span className="text-[var(--dc-text-secondary)] font-medium">
                        {dueDate.toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
}
