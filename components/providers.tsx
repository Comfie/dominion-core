'use client';

import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/lib/settings-context';
import { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <SettingsProvider>{children}</SettingsProvider>
        </SessionProvider>
    );
}
