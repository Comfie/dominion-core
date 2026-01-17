'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Target, TrendingUp, ShoppingBag, Settings } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: ShoppingBag, label: 'Expenses', path: '/expenses' },
    { icon: TrendingUp, label: 'Income', path: '/income' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function BottomNav() {
    const { status } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    // Hide if not authenticated or on auth pages
    if (status !== 'authenticated' || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dc-bg-primary)] to-transparent pointer-events-none" />

            <div className="glass relative flex items-center justify-around px-2 pb-safe pt-2 border-t border-[var(--dc-border)] bg-[var(--dc-bg-card)]/90 backdrop-blur-xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center w-full py-2 gap-1 group"
                        >
                            <div className="relative">
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute -inset-2 bg-gradient-to-tr from-[var(--dc-primary)]/20 to-[var(--dc-accent)]/20 blur-md rounded-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}

                                <item.icon
                                    className={`w-6 h-6 transition-all duration-300 ${isActive
                                        ? 'text-[var(--dc-primary)] scale-110'
                                        : 'text-[var(--dc-text-muted)] group-hover:text-[var(--dc-text-secondary)]'
                                        }`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>

                            <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-[var(--dc-text-primary)]' : 'text-[var(--dc-text-muted)]'
                                }`}>
                                {item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-[var(--dc-primary)] to-[var(--dc-accent)] rounded-b-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
