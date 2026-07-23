'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthShellProps {
    children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
    const shouldReduceMotion = useReducedMotion();
    const transition = { duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' as const };

    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--dc-bg-primary)] px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))]">
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-60"
                style={{
                    background: 'radial-gradient(circle, var(--dc-primary) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />

            <div className="relative w-full max-w-md">
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition}
                    className="mb-8 text-center"
                >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dc-primary)]/10">
                        <Wallet className="h-6 w-6 text-[var(--dc-primary)]" />
                    </div>
                    <h1 className="text-2xl font-semibold text-[var(--dc-text-primary)]">
                        Dominion Core
                    </h1>
                    <p className="mt-1 text-sm text-[var(--dc-text-muted)]">
                        Personal Finance Dashboard
                    </p>
                </motion.div>

                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.08 }}
                    className="card relative p-6"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
