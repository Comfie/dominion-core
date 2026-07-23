# Login Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the login screen toward a restrained, "warm & trustworthy" mobile-first aesthetic, and add a coming-soon forgot-password page.

**Architecture:** Extract a shared `AuthShell` component (background wash, icon-mark header, animated card wrapper) used by both the redesigned login page and the new forgot-password page. Login's NextAuth submit logic is unchanged — only markup/styling and two additive UI pieces (password visibility toggle, forgot-password link) change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, framer-motion, lucide-react, next-auth (client `signIn`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-23-login-redesign-design.md`
- No changes to `app/globals.css` design tokens — reuse existing `--dc-*` variables only.
- No changes to `app/(auth)/register/page.tsx`, `components/layout/BottomNav.tsx`, or `components/layout/DesktopSidebar.tsx` — out of scope.
- Primary target is mobile PWA; layout must use `min-h-dvh` and safe-area padding, and input font size must stay ≥16px to avoid iOS auto-zoom.
- `signIn('credentials', ...)` flow, `mapErrorMessage`, and redirect-on-success behavior in login must be preserved exactly — this is a visual/UX pass, not a logic change.
- All motion must respect `prefers-reduced-motion` via framer-motion's `useReducedMotion` hook.
- The forgot-password page is a static placeholder only — no email input, no backend call.
- No test framework exists in this repo (`package.json` has no test script, no `*.test.*`/`*.spec.*` files) — verification is via `tsc --noEmit`, `npm run lint`, and manual/browser visual checks, not unit tests.

---

### Task 1: Shared `AuthShell` component

**Files:**
- Create: `components/auth/AuthShell.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `AuthShell({ children }: { children: ReactNode })` — a React component. Renders a full-height page shell (background wash + "Dominion Core" icon-mark header) around a `.card`-wrapped `children`. Used by Task 2 (login) and Task 3 (forgot-password).

- [ ] **Step 1: Create the component directory and file**

Create `components/auth/AuthShell.tsx` with this content:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors referencing `components/auth/AuthShell.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/auth/AuthShell.tsx
git commit -m "feat: add shared AuthShell for auth pages"
```

---

### Task 2: Redesign login page

**Files:**
- Modify: `app/(auth)/login/page.tsx` (full rewrite of the returned JSX and imports; `handleSubmit`/`mapErrorMessage` logic unchanged)

**Interfaces:**
- Consumes: `AuthShell` from `components/auth/AuthShell.tsx` (Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the file contents**

Replace all of `app/(auth)/login/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            // Check ok first - if login succeeded, redirect regardless of error field
            if (result?.ok) {
                router.push('/');
                router.refresh();
            } else if (result?.error && result.error !== 'undefined') {
                // Only show error if it's a real error message
                const errorMessage = mapErrorMessage(result.error);
                setError(errorMessage);
            } else {
                setError('Login failed. Please try again.');
            }
        } catch {
            setError('Unable to connect. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // Map error messages to user-friendly text
    const mapErrorMessage = (error: string): string => {
        if (error.includes('No user found')) {
            return 'No account found with this email. Please check your email or create an account.';
        }
        if (error.includes('Invalid password')) {
            return 'Incorrect password. Please try again.';
        }
        if (error.includes('email and password')) {
            return 'Please enter your email and password.';
        }
        if (error.includes('database') || error.includes('connection')) {
            return 'Unable to connect to server. Please try again in a moment.';
        }
        return 'Something went wrong. Please try again.';
    };

    return (
        <AuthShell>
            <h2 className="mb-6 text-xl font-semibold text-[var(--dc-text-primary)]">
                Welcome back
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm text-[var(--dc-text-secondary)]">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-[52px] w-full rounded-2xl border border-[var(--dc-border)] bg-[var(--dc-bg-secondary)] px-4 text-base text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] transition-colors focus:border-[var(--dc-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dc-primary)]/20"
                        required
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm text-[var(--dc-text-secondary)]">
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-[var(--dc-primary)] hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-[52px] w-full rounded-2xl border border-[var(--dc-border)] bg-[var(--dc-bg-secondary)] px-4 pr-12 text-base text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] transition-colors focus:border-[var(--dc-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dc-primary)]/20"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--dc-text-muted)] transition-colors hover:text-[var(--dc-text-secondary)]"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-[var(--dc-danger)]/10 px-4 py-3 text-sm text-[var(--dc-danger)]"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-2xl bg-[var(--dc-primary)] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
                </button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center">
                <p className="text-[var(--dc-text-muted)]">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-[var(--dc-primary)] hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors referencing `app/(auth)/login/page.tsx`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: No new errors/warnings on `app/(auth)/login/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat: redesign login page with quiet, mobile-first UI"
```

---

### Task 3: Forgot-password placeholder page

**Files:**
- Create: `app/(auth)/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `AuthShell` from `components/auth/AuthShell.tsx` (Task 1).
- Produces: route `/forgot-password`, linked from Task 2's login page.

- [ ] **Step 1: Create the route file**

Create `app/(auth)/forgot-password/page.tsx` with:

```tsx
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
    return (
        <AuthShell>
            <h2 className="mb-2 text-xl font-semibold text-[var(--dc-text-primary)]">
                Reset your password
            </h2>
            <p className="mb-6 text-[var(--dc-text-secondary)]">
                Password reset isn&apos;t available yet. Check back soon, or sign back in if you remember your password.
            </p>
            <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-2xl bg-[var(--dc-primary)] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
                Back to sign in
            </Link>
        </AuthShell>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors referencing `app/(auth)/forgot-password/page.tsx`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: No new errors/warnings on the new file.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/forgot-password/page.tsx"
git commit -m "feat: add coming-soon forgot-password page"
```

---

### Task 4: Manual verification pass

**Files:** none (verification only — no test framework exists in this repo).

**Interfaces:**
- Consumes: the running dev server serving Tasks 1–3's routes.
- Produces: nothing (terminal task).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running; note the port, typically `http://localhost:3000`)

- [ ] **Step 2: Visually verify `/login` in dark mode**

Using the Playwright browser tools (`mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:3000/login`, then `mcp__plugin_playwright_playwright__browser_take_screenshot`), confirm:
- Icon mark + "Dominion Core" wordmark + "Personal Finance Dashboard" caption render above the card, no gradient text.
- Email and password fields have no left-side icons, visible top labels, and a "Forgot password?" link next to the Password label.
- Clicking the eye icon in the password field toggles the input between masked and plain text (use `mcp__plugin_playwright_playwright__browser_click` on the toggle button, then re-screenshot).
- The submit button reads "Sign in" with no arrow icon.
- Layout fills the viewport height with no obvious scroll on a mobile viewport size (`mcp__plugin_playwright_playwright__browser_resize` to e.g. 390x844 before screenshotting).

- [ ] **Step 3: Visually verify `/login` in light mode**

Toggle the app's light theme (via the Appearance setting if reachable pre-login, or by checking the `light` class is applied through devtools/`browser_evaluate` setting `document.documentElement.classList.add('light')`), re-screenshot, and confirm text/border contrast still reads clearly — no hardcoded dark-only colors were introduced (all colors used are `--dc-*` tokens which already have light-mode values).

- [ ] **Step 4: Visually verify `/forgot-password`**

Navigate to `http://localhost:3000/forgot-password`, screenshot, and confirm the same shell/header renders, with the "Reset your password" heading, coming-soon message, and a working "Back to sign in" link (click it, confirm it navigates to `/login`).

- [ ] **Step 5: Confirm login flow still works end-to-end**

Using valid test credentials (or by attempting an invalid login first to confirm the error state renders with the softened red styling), submit the form and confirm redirect-on-success or the mapped error message still behaves as before — this is unchanged logic, so it should pass without modification.

No commit for this task — it's verification only. If any step surfaces a bug, fix it in the relevant task's file and re-run the affected verification steps before moving on.
