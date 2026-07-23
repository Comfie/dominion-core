# Light Theme Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully working light theme to Dominion Core, alongside the existing dark theme, defaulting to the OS/browser color-scheme preference with a manual override in Settings.

**Architecture:** Use the `next-themes` library (`attribute="class"`, `defaultTheme="system"`, `storageKey="dc-theme"`) to toggle a `light`/`dark` class on `<html>`. `app/globals.css` keeps its existing `:root` block as the dark-theme default (unchanged values) and gains a new `.light { ... }` override block with light-theme token values — component code that reads `var(--dc-*)` needs no changes. A new `AppearanceSettings` component (mirroring the existing `NotificationSettings` pattern) exposes System/Light/Dark radio-style options on the Settings page, calling `next-themes`' `setTheme()` directly — no server round trip, no DB write.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Tailwind CSS v4 (CSS custom properties, not `dark:` variants), `next-themes` (new dependency), `framer-motion`, `lucide-react`.

## Global Constraints

- Default theme is `system` (OS/browser `prefers-color-scheme`); manual override persists in `localStorage` under key `dc-theme` only — no server/DB sync (per `docs/superpowers/specs/2026-07-23-light-theme-design.md`).
- Theme toggle UI lives only on the Settings page (`app/(dashboard)/settings/page.tsx`) — no header/nav quick toggle.
- All existing `--dc-*` CSS custom property **names** must be preserved; only values may change or be added.
- No flash-of-wrong-theme on page load.
- No automated visual test suite exists in this repo (confirmed via `package.json` — no jest/vitest/playwright test runner configured). Verification is manual/visual, driven via the Playwright MCP browser tools, not unit tests.
- The app requires an authenticated session for all dashboard pages. Use the seeded demo account (`demo@dominioncore.com` / `demo1234`, created via `npx tsx scripts/seed-demo.ts`) for manual QA — do not invent or assume other credentials.

---

### Task 1: Install next-themes and wire up ThemeProvider

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `components/providers.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `Providers` (`components/providers.tsx`) now wraps `children` in `next-themes`' `ThemeProvider`, configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `storageKey="dc-theme"`. Later tasks (3, 4) call `useTheme()` from `next-themes` inside this provider's subtree.

- [ ] **Step 1: Install the dependency**

Run: `npm install next-themes@^0.4.6`
Expected: `package.json` gains `"next-themes": "^0.4.6"` under `dependencies`; `npm install` exits 0.

- [ ] **Step 2: Wrap the app in ThemeProvider**

Replace the full contents of `components/providers.tsx`:

```tsx
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
```

- [ ] **Step 3: Remove the hardcoded dark class and suppress the expected hydration warning**

In `app/layout.tsx`, `next-themes` sets the `class` attribute on `<html>` client-side after the server renders it without one — React would otherwise log a hydration mismatch warning for this specific, expected attribute. `suppressHydrationWarning` on `<html>` is the documented `next-themes` fix (it only suppresses the warning for `<html>`'s own attributes, not for any mismatched children).

Change:
```tsx
    <html lang="en" className="dark">
```
to:
```tsx
    <html lang="en" suppressHydrationWarning>
```

(Full line 44 of `app/layout.tsx`; no other lines in this file change for this task.)

- [ ] **Step 4: Verify no hydration errors and that the class is applied**

Run: `npm run dev`

Then use the Playwright MCP browser tools:
1. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/login`
2. `mcp__plugin_playwright_playwright__browser_console_messages` — confirm there are no React hydration-mismatch errors/warnings.
3. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => document.documentElement.className` — expected result is `"dark"` (since no `dc-theme` value is in `localStorage` yet and the test environment's OS-level color scheme defaults to dark, or `next-themes` falls back to `defaultTheme`'s resolved value).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json components/providers.tsx app/layout.tsx
git commit -m "feat: wire up next-themes ThemeProvider for light/dark switching"
```

---

### Task 2: Add light-theme token values to globals.css

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `.light` CSS class defining light-theme values for every `--dc-*` token that needs to differ from the dark defaults in `:root`. Two previously-undefined tokens (`--dc-bg-secondary`, `--dc-primary-dark`) are now defined in both `:root` (dark) and `.light`. `.glass`/`.glass-card` now reference new `--dc-glass-bg`/`--dc-glass-card-bg` tokens instead of hardcoded `rgba(...)` values, so they also flip with theme. Task 4's UI and all existing components consume these values automatically via their existing `var(--dc-*)` references — no other files need to change for this task.

- [ ] **Step 1: Add the two missing tokens to `:root` (dark defaults)**

In `app/globals.css`, inside the existing `:root { ... }` block, add `--dc-bg-secondary` right after the `--dc-bg-elevated` line, and `--dc-primary-dark` right after `--dc-primary-soft`:

```css
  --dc-primary: #8b5cf6;
  /* Violet */
  --dc-primary-soft: #a78bfa;
  --dc-primary-dark: #7c3aed;
  --dc-secondary: #06b6d4;
```

```css
  --dc-bg-card: #181823;
  /* Card background */
  --dc-bg-elevated: #232332;
  /* Popups/Modals */
  --dc-bg-secondary: #14151f;
  /* Inputs, hover states, chips */
```

- [ ] **Step 2: Add glass-effect tokens to `:root` (dark defaults)**

Still inside `:root { ... }`, add after the existing `--dc-shadow-glow-accent` line:

```css
  --dc-shadow-glow-accent: 0 0 20px rgba(244, 114, 182, 0.15);

  /* Glass effect backgrounds */
  --dc-glass-bg: rgba(15, 16, 22, 0.7);
  --dc-glass-card-bg: rgba(24, 24, 35, 0.6);
}
```

- [ ] **Step 3: Point `.glass` and `.glass-card` at the new tokens**

Replace:
```css
.glass {
  background: rgba(15, 16, 22, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--dc-border);
}

.glass-card {
  background: rgba(24, 24, 35, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--dc-border);
  box-shadow: var(--dc-shadow-md);
}
```
with:
```css
.glass {
  background: var(--dc-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--dc-border);
}

.glass-card {
  background: var(--dc-glass-card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--dc-border);
  box-shadow: var(--dc-shadow-md);
}
```

- [ ] **Step 4: Add the `.light` override block**

Immediately after the closing `}` of the `:root` block (right before the `/* Base styles */` comment), add:

```css
.light {
  --dc-primary: #7c3aed;
  --dc-primary-dark: #6d28d9;

  --dc-bg-body: #f1f5f9;
  --dc-bg-primary: #f8fafc;
  --dc-bg-card: #ffffff;
  --dc-bg-elevated: #ffffff;
  --dc-bg-secondary: #f1f5f9;

  --dc-border: rgba(15, 23, 42, 0.08);
  --dc-border-highlight: rgba(124, 58, 237, 0.25);

  --dc-text-primary: #0f172a;
  --dc-text-secondary: #475569;
  --dc-text-muted: #64748b;

  --dc-gradient-primary: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
  --dc-gradient-card: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%);
  --dc-gradient-subtle: linear-gradient(to bottom right, rgba(124, 58, 237, 0.06), transparent);
  --dc-gradient-glass: linear-gradient(180deg, rgba(15, 23, 42, 0.03) 0%, rgba(15, 23, 42, 0.0) 100%);

  --dc-shadow-sm: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
  --dc-shadow-md: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
  --dc-shadow-lg: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.06);
  --dc-shadow-glow: 0 0 20px rgba(124, 58, 237, 0.12);
  --dc-shadow-glow-accent: 0 0 20px rgba(244, 114, 182, 0.12);

  --dc-glass-bg: rgba(255, 255, 255, 0.7);
  --dc-glass-card-bg: rgba(255, 255, 255, 0.6);
}
```

Note what is deliberately **not** overridden here: `--dc-secondary`, `--dc-accent`, `--dc-success`, `--dc-warning`, `--dc-danger`, `--dc-info`, `--dc-primary-soft`, `--dc-gradient-secondary`, `--dc-gradient-accent`. These are used only decoratively (gradient backgrounds, glows, a notification-dot badge — confirmed by grep during spec review, see `docs/superpowers/specs/2026-07-23-light-theme-design.md`), never as plain text, so they read fine unchanged on either background and stay identical across themes for brand consistency.

- [ ] **Step 5: Verify visually**

Run: `npm run dev` (if not already running from Task 1).

Using the Playwright MCP browser tools:
1. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/login`
2. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => { document.documentElement.className = 'light'; }` to force light mode without needing the UI (which doesn't exist until Task 4).
3. `mcp__plugin_playwright_playwright__browser_take_screenshot` — confirm the login page now shows a white/light background, dark legible text, and a visibly card-styled login box with a soft shadow (not the dark palette).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat: add light theme token palette to globals.css"
```

---

### Task 3: Sync the PWA theme-color meta tag with the resolved theme

**Files:**
- Create: `components/ThemeColorSync.tsx`
- Modify: `components/providers.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `next-themes` (available because this component renders inside the `ThemeProvider` added in Task 1).
- Produces: no exports consumed by later tasks — this is a self-contained side-effect component.

- [ ] **Step 1: Create the sync component**

Create `components/ThemeColorSync.tsx`:

```tsx
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
```

- [ ] **Step 2: Mount it inside the ThemeProvider**

In `components/providers.tsx`, import and render `ThemeColorSync` as a child of `ThemeProvider`:

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/lib/settings-context';
import { ThemeProvider } from 'next-themes';
import { ThemeColorSync } from '@/components/ThemeColorSync';
import { ReactNode } from 'react';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="dc-theme">
            <ThemeColorSync />
            <SessionProvider>
                <SettingsProvider>{children}</SettingsProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}
```

- [ ] **Step 3: Verify the meta tag updates**

Using the Playwright MCP browser tools (dev server already running):
1. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/login`
2. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')` — expected `"#0a0a0f"` (dark default).
3. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => { localStorage.setItem('dc-theme', 'light'); location.reload(); }`
4. Wait for reload, then `mcp__plugin_playwright_playwright__browser_evaluate` with the same meta-tag query — expected `"#f8fafc"`.
5. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => { localStorage.removeItem('dc-theme'); }` to reset state for later tasks.

- [ ] **Step 4: Commit**

```bash
git add components/ThemeColorSync.tsx components/providers.tsx
git commit -m "feat: sync PWA theme-color meta tag with resolved theme"
```

---

### Task 4: Add the Appearance settings UI

**Files:**
- Create: `components/settings/AppearanceSettings.tsx`
- Modify: `app/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `next-themes` (Task 1's `ThemeProvider` wraps this page).
- Produces: `AppearanceSettings` component, default export style matches `NotificationSettings`/`CategorySettings` (named export, optional `className` prop).

- [ ] **Step 1: Create the component**

Create `components/settings/AppearanceSettings.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire it into the Settings page**

In `app/(dashboard)/settings/page.tsx`, add the import alongside the other settings component imports (after the `CategorySettings` import on line 12):

```tsx
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
```

Then render it as its own card, placed right after the "Financial Profile" `motion.div` closes (after line 328's `</motion.div>`) and before the "Family Members" section comment (line 330):

```tsx
                </motion.div>

                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <AppearanceSettings />
                </motion.div>

                {/* Family Members / Persons */}
```

- [ ] **Step 3: Verify the full toggle flow end-to-end**

Run: `npm run dev` (if not already running).

Using the Playwright MCP browser tools:
1. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/login`
2. `mcp__plugin_playwright_playwright__browser_type`/`browser_fill_form` to log in with `demo@dominioncore.com` / `demo1234`, then submit.
3. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/settings`
4. `mcp__plugin_playwright_playwright__browser_snapshot` — confirm an "Appearance" card is visible with System/Light/Dark options.
5. `mcp__plugin_playwright_playwright__browser_click` the "Light" option.
6. `mcp__plugin_playwright_playwright__browser_take_screenshot` — confirm the whole page (header, cards, inputs) has switched to the light palette, and the "Light" option shows the selected state (violet-tinted background, filled radio dot).
7. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => localStorage.getItem('dc-theme')` — expected `"light"`.
8. Reload the page (`browser_navigate` to the same URL) — confirm it stays light (no flash of dark before settling), proving persistence works.
9. Click "Dark", confirm it switches back, then click "System" to leave it in the default state for later tasks.

- [ ] **Step 4: Commit**

```bash
git add components/settings/AppearanceSettings.tsx "app/(dashboard)/settings/page.tsx"
git commit -m "feat: add Appearance settings UI for theme selection"
```

---

### Task 5: Fix the one dark-only-tuned badge in the import flow

**Files:**
- Modify: `app/(dashboard)/import/page.tsx`

**Interfaces:** none — self-contained one-line fix.

- [ ] **Step 1: Replace the hardcoded gray badge classes**

In `app/(dashboard)/import/page.tsx` around line 666, this confidence badge was tuned assuming a dark canvas and loses contrast on light backgrounds:

```tsx
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${match.confidence === 'high'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : match.confidence === 'medium'
                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                    : 'bg-gray-500/20 text-gray-400'
                                                                }`}>
```

Change only the last branch:

```tsx
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${match.confidence === 'high'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : match.confidence === 'medium'
                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                    : 'bg-[var(--dc-bg-elevated)] text-[var(--dc-text-secondary)]'
                                                                }`}>
```

- [ ] **Step 2: Verify visually in both themes**

The demo account needs at least one low-confidence match to render this badge; if the seeded demo data doesn't produce one, verify structurally instead:

Using the Playwright MCP browser tools (logged in from Task 4, dev server running):
1. `mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/import`
2. `mcp__plugin_playwright_playwright__browser_evaluate` with `() => document.documentElement.className = 'light'` then `() => document.documentElement.className = 'dark'` in turn, screenshotting the import matches list each time if any confidence badges are visible on screen — confirm no badge with the old literal `bg-gray-500`/`text-gray-400` classes remains in the rendered HTML by checking `() => document.body.innerHTML.includes('bg-gray-500/20')` returns `false`.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/import/page.tsx"
git commit -m "fix: use theme-aware colors for low-confidence import match badge"
```

---

### Task 6: Full manual QA sweep across main screens in both themes

**Files:** none expected — this task fixes anything it finds, in whichever file needs it.

**Interfaces:** none.

- [ ] **Step 1: Walk every main screen in Dark**

Dev server running, logged in as `demo@dominioncore.com` / `demo1234` (Task 4), theme currently `system`/whatever it resolves to — force dark first:

Using the Playwright MCP browser tools, run `mcp__plugin_playwright_playwright__browser_evaluate` with `() => { localStorage.setItem('dc-theme', 'dark'); location.reload(); }`, then for each URL below: `browser_navigate`, then `browser_take_screenshot`:
- `http://localhost:3000/` (dashboard)
- `http://localhost:3000/expenses`
- `http://localhost:3000/obligations`
- `http://localhost:3000/goals`
- `http://localhost:3000/insights`
- `http://localhost:3000/settings`

Confirm each looks correct (this is the unchanged, pre-existing dark theme — a regression check, not new design work).

- [ ] **Step 2: Walk every main screen in Light**

`mcp__plugin_playwright_playwright__browser_evaluate` with `() => { localStorage.setItem('dc-theme', 'light'); location.reload(); }`, then repeat the same `browser_navigate` + `browser_take_screenshot` pass over all six URLs from Step 1.

For each screenshot, check specifically for:
- Text that's illegible (low contrast against its background).
- Any element still showing a near-black or pure-black background/box that should be light (a sign of a missed hardcoded color).
- Chart legibility in `/` (dashboard, `SpendingChart`/`MonthOverMonthChart`) and `/insights`.
- Modal/dialog contrast — open at least one modal (e.g. "Add Expense" on `/expenses`) and screenshot it, since modals use `.card` and `.glass-card` styles touched in Task 2.

- [ ] **Step 3: Fix anything found**

For each issue found in Step 2, make the minimal targeted fix (token swap or hex adjustment, following the same pattern as Task 5), then re-screenshot that specific page in light mode to confirm the fix. If no issues are found, skip this step — do not invent speculative fixes.

- [ ] **Step 4: Reset to default state and do a final sanity pass**

`mcp__plugin_playwright_playwright__browser_evaluate` with `() => { localStorage.removeItem('dc-theme'); location.reload(); }` — confirm the app falls back to following system preference with no console errors (`browser_console_messages`).

- [ ] **Step 5: Commit (only if Step 3 made changes)**

```bash
git add -A
git commit -m "fix: address light-theme contrast/legibility issues found in QA sweep"
```

If Step 3 found nothing to fix, there is nothing to commit for this task — say so explicitly rather than creating an empty commit.

---

## Self-Review Notes

- **Spec coverage:** `next-themes` architecture (Task 1), token restructuring incl. both missing tokens and glass tokens (Task 2), theme-color meta sync (Task 3), Settings UI (Task 4), the one real hardcoded-color gap (Task 5), and the manual QA pass promised in the spec's "Testing / verification" section (Task 6) are all covered. No spec section lacks a task.
- **Type consistency:** `setTheme('system' | 'light' | 'dark')` in `AppearanceSettings.tsx` matches the `THEME_OPTIONS` value union exactly; `useTheme()`'s `theme`/`resolvedTheme`/`setTheme` are used per `next-themes`' actual API (not invented names) in both `ThemeColorSync.tsx` and `AppearanceSettings.tsx`.
- **No placeholders:** every step has literal code or literal shell commands; QA steps name exact URLs and exact tool calls rather than "test thoroughly".
