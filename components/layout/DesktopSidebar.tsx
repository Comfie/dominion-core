'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home,
    Target,
    TrendingUp,
    ShoppingBag,
    Settings,
    CreditCard,
    BarChart3,
    LogOut,
    Sparkles
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: BarChart3, label: 'Insights', path: '/insights' },
    { icon: ShoppingBag, label: 'Expenses', path: '/expenses' },
    { icon: CreditCard, label: 'Obligations', path: '/obligations' },
    { icon: TrendingUp, label: 'Income', path: '/income' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function DesktopSidebar() {
    const { status, data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    // Hide if not authenticated or on auth pages
    if (status !== 'authenticated' || pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
        return null;
    }

    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[var(--dc-bg-card)] border-r border-[var(--dc-border)] z-50">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--dc-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--dc-primary)] to-[var(--dc-accent)] flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--dc-text-primary)]">
                            Dominion
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">Core Finance</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-[var(--dc-primary)]/20 text-[var(--dc-primary)]'
                                : 'text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-secondary)] hover:text-[var(--dc-text-primary)]'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--dc-primary)]' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="ml-auto w-1.5 h-6 bg-[var(--dc-primary)] rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-[var(--dc-border)]">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                            {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-[var(--dc-text-muted)] truncate">
                            {session?.user?.email}
                        </p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400 transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
