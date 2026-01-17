'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

            if (result?.error) {
                // Map technical errors to user-friendly messages
                const errorMessage = mapErrorMessage(result.error);
                setError(errorMessage);
            } else {
                router.push('/');
                router.refresh();
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
        <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold gradient-text mb-2"
                    >
                        Dominion Core
                    </motion.h1>
                    <p className="text-[var(--dc-text-muted)]">
                        Personal Finance Dashboard
                    </p>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6"
                >
                    <h2 className="text-xl font-semibold text-[var(--dc-text-primary)] mb-6">
                        Welcome back
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--dc-text-muted)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 pl-11 pr-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-[var(--dc-text-secondary)] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--dc-text-muted)]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 pl-11 pr-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--dc-primary)] to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <div className="mt-6 text-center">
                        <p className="text-[var(--dc-text-muted)]">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-[var(--dc-primary)] hover:underline"
                            >
                                Create one
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
