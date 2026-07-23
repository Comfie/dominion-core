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
