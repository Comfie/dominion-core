'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const THEME_COLORS = {
    dark: '#0a0a0f',
    light: '#f8fafc',
} as const;

export function ThemeColorSync() {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!resolvedTheme) return;
        const color = resolvedTheme === 'light' ? THEME_COLORS.light : THEME_COLORS.dark;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    }, [resolvedTheme]);

    return null;
}
