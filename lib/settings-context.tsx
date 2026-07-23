'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface UserSettings {
    currency: string;
    monthlyIncome: number;
    monthlyBudget: number | null;
    payday: number;
}

interface SettingsContextValue {
    settings: UserSettings;
    isLoading: boolean;
    refetch: () => Promise<void>;
    setCurrency: (currency: string) => void;
}

const defaultSettings: UserSettings = {
    currency: 'ZAR',
    monthlyIncome: 0,
    monthlyBudget: null,
    payday: 25,
};

const SettingsContext = createContext<SettingsContextValue>({
    settings: defaultSettings,
    isLoading: true,
    refetch: async () => {},
    setCurrency: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { status } = useSession();
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    currency: data.currency ?? 'ZAR',
                    monthlyIncome: data.monthlyIncome ?? 0,
                    monthlyBudget: data.monthlyBudget ?? null,
                    payday: data.payday ?? 25,
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSettings();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status, fetchSettings]);

    const setCurrency = useCallback((currency: string) => {
        setSettings((prev) => ({ ...prev, currency }));
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, isLoading, refetch: fetchSettings, setCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

export function useCurrency() {
    return useContext(SettingsContext).settings.currency;
}
