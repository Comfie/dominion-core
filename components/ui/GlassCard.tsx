'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    gradient?: boolean;
}

export function GlassCard({ children, className, delay = 0, gradient = false }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            className={cn(
                'glass-card rounded-[20px] p-5 relative overflow-hidden group',
                gradient && 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none',
                className
            )}
        >
            <div className="relative z-10 h-full">
                {children}
            </div>

            {/* Hover glow effect */}
            <div className="absolute -inset-[100px] bg-gradient-to-r from-[var(--dc-primary)]/10 to-[var(--dc-accent)]/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
}
