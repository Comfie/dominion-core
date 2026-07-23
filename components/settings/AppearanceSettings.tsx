'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

interface AppearanceSettingsProps {
    className?: string;
}

const THEME_OPTIONS = [
    { value: 'system' as const, label: 'System', description: 'Match your device setting', icon: Monitor },
    { value: 'light' as const, label: 'Light', description: 'Bright background, dark text', icon: Sun },
    { value: 'dark' as const, label: 'Dark', description: 'Deep background, light text', icon: Moon },
];

export function AppearanceSettings({ className = '' }: AppearanceSettingsProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration-safe mounted check
        setMounted(true);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-5 ${className}`}
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)]">
                        Appearance
                    </h3>
                    <p className="text-xs text-[var(--dc-text-muted)]">
                        Choose how Dominion Core looks
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = mounted && theme === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setTheme(option.value)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${isSelected
                                    ? 'bg-[var(--dc-primary)]/10 border-[var(--dc-primary)]'
                                    : 'bg-[var(--dc-bg-secondary)] border-[var(--dc-border)] hover:border-[var(--dc-border-highlight)]'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-[var(--dc-bg-elevated)] flex items-center justify-center">
                                <Icon className="w-4 h-4 text-[var(--dc-text-secondary)]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[var(--dc-text-primary)]">
                                    {option.label}
                                </p>
                                <p className="text-xs text-[var(--dc-text-muted)]">
                                    {option.description}
                                </p>
                            </div>
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--dc-primary)]' : 'border-[var(--dc-border)]'
                                    }`}
                            >
                                {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-[var(--dc-primary)]" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
