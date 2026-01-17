'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Loader2, AlertCircle, Calendar, DollarSign, Target, Check } from 'lucide-react';
import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    sendLocalNotification,
    NotificationTypes,
} from '@/lib/notifications';

interface NotificationPreferences {
    notifyBudgetAlerts: boolean;
    notifyUpcomingBills: boolean;
    notifyPayday: boolean;
    notifyGoalProgress: boolean;
    hasSubscription: boolean;
}

interface NotificationSettingsProps {
    className?: string;
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [testSent, setTestSent] = useState(false);

    useEffect(() => {
        setIsSupported(isNotificationSupported());
        setPermission(getNotificationPermission());
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/notifications/preferences');
            if (res.ok) {
                const data = await res.json();
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableNotifications = async () => {
        const result = await requestNotificationPermission();
        setPermission(result);

        if (result === 'granted') {
            // Save subscription status
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: { enabled: true } }),
            });
            fetchPreferences();
        }
    };

    const handleTogglePreference = async (key: keyof Omit<NotificationPreferences, 'hasSubscription'>) => {
        if (!preferences) return;

        const newValue = !preferences[key];
        setPreferences({ ...preferences, [key]: newValue });
        setIsSaving(true);

        try {
            await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newValue }),
            });
        } catch (error) {
            console.error('Error saving preference:', error);
            // Revert on error
            setPreferences({ ...preferences, [key]: !newValue });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestNotification = async () => {
        const success = await sendLocalNotification(NotificationTypes.paydayReminder(3));
        if (success) {
            setTestSent(true);
            setTimeout(() => setTestSent(false), 3000);
        }
    };

    if (!isSupported) {
        return (
            <div className={`card p-5 ${className}`}>
                <div className="flex items-center gap-3 text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">Notifications are not supported in this browser.</p>
                </div>
            </div>
        );
    }

    const preferenceOptions = [
        {
            key: 'notifyBudgetAlerts' as const,
            icon: DollarSign,
            label: 'Budget Alerts',
            description: 'Get notified when you exceed 80% of a budget',
        },
        {
            key: 'notifyUpcomingBills' as const,
            icon: Calendar,
            label: 'Upcoming Bills',
            description: 'Reminders 3 days before bills are due',
        },
        {
            key: 'notifyPayday' as const,
            icon: DollarSign,
            label: 'Payday Reminders',
            description: 'Get notified before and on payday',
        },
        {
            key: 'notifyGoalProgress' as const,
            icon: Target,
            label: 'Goal Milestones',
            description: 'Celebrate when you hit 25%, 50%, 75%, 100%',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-5 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)]">
                        Notifications
                    </h3>
                    <p className="text-xs text-[var(--dc-text-muted)]">
                        Stay on top of your finances
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--dc-primary)]" />
                </div>
            ) : permission !== 'granted' ? (
                /* Permission not granted */
                <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <BellOff className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="font-medium text-[var(--dc-text-primary)] mb-2">
                        Enable Notifications
                    </h4>
                    <p className="text-sm text-[var(--dc-text-muted)] mb-4 max-w-xs mx-auto">
                        Get reminders about upcoming bills, budget alerts, and payday notifications.
                    </p>
                    <button
                        onClick={handleEnableNotifications}
                        className="px-6 py-2.5 rounded-xl bg-[var(--dc-primary)] text-white font-medium hover:bg-[var(--dc-primary-dark)] transition-colors"
                    >
                        Enable Notifications
                    </button>
                    {permission === 'denied' && (
                        <p className="text-xs text-red-400 mt-3">
                            Notifications are blocked. Please enable them in your browser settings.
                        </p>
                    )}
                </div>
            ) : (
                /* Preferences */
                <div className="space-y-3">
                    {preferenceOptions.map((option, index) => {
                        const Icon = option.icon;
                        const isEnabled = preferences?.[option.key] ?? true;

                        return (
                            <motion.div
                                key={option.key}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--dc-bg-elevated)] flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-[var(--dc-text-secondary)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--dc-text-primary)]">
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-[var(--dc-text-muted)]">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle switch */}
                                <button
                                    onClick={() => handleTogglePreference(option.key)}
                                    disabled={isSaving}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-[var(--dc-primary)]' : 'bg-[var(--dc-bg-elevated)]'
                                        }`}
                                >
                                    <motion.div
                                        layout
                                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                                        animate={{ left: isEnabled ? '24px' : '4px' }}
                                    />
                                </button>
                            </motion.div>
                        );
                    })}

                    {/* Test notification button */}
                    <div className="pt-3 border-t border-[var(--dc-border)]">
                        <button
                            onClick={handleTestNotification}
                            disabled={testSent}
                            className="w-full py-2.5 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] text-sm font-medium hover:bg-[var(--dc-bg-elevated)] transition-colors flex items-center justify-center gap-2"
                        >
                            {testSent ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400">Test notification sent!</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="w-4 h-4" />
                                    Send Test Notification
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
