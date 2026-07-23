'use client';

import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/lib/settings-context';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="dc-theme">
            <SessionProvider>
                <SettingsProvider>{children}</SettingsProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}
