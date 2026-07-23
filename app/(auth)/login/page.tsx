'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const shouldReduceMotion = useReducedMotion();

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
                        initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-xl bg-[var(--dc-danger)]/10 px-4 py-3 text-sm text-[var(--dc-danger)]"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
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
