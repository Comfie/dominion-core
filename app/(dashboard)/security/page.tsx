'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Server, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
    const securityFeatures = [
        {
            icon: Lock,
            title: 'Encrypted Passwords',
            description: 'Your password is hashed using bcrypt with 12 rounds of salting. We never store plain text passwords.',
            color: 'text-green-400',
            bg: 'bg-green-500/20',
        },
        {
            icon: Server,
            title: 'No Bank Connections',
            description: 'We never connect to your bank accounts. All data is manually entered by you, giving you full control.',
            color: 'text-blue-400',
            bg: 'bg-blue-500/20',
        },
        {
            icon: Eye,
            title: 'Data Isolation',
            description: 'Your financial data is completely isolated. No other user can ever see your information.',
            color: 'text-purple-400',
            bg: 'bg-purple-500/20',
        },
        {
            icon: Shield,
            title: 'HTTPS Encryption',
            description: 'All data transmitted between your device and our servers is encrypted using TLS/SSL.',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/20',
        },
    ];

    const dataStored = [
        { stored: true, item: 'Email address (for login)' },
        { stored: true, item: 'Encrypted password' },
        { stored: true, item: 'Expense names and amounts' },
        { stored: true, item: 'Obligation names and amounts' },
        { stored: true, item: 'Income entries' },
        { stored: false, item: 'Bank account numbers' },
        { stored: false, item: 'Credit/debit card details' },
        { stored: false, item: 'Bank login credentials' },
        { stored: false, item: 'ID numbers or personal documents' },
    ];

    return (
        <div className="min-h-screen bg-[var(--dc-bg-primary)] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--dc-bg-primary)]/80 backdrop-blur-md border-b border-[var(--dc-border)]">
                <div className="px-4 py-4">
                    <Link href="/" className="text-[var(--dc-text-muted)] text-sm mb-1 block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-xl font-bold text-[var(--dc-text-primary)]">
                        Security & Privacy
                    </h1>
                </div>
            </header>

            <main className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6"
                >
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--dc-text-primary)] mb-2">
                        Your Data is Safe
                    </h2>
                    <p className="text-[var(--dc-text-muted)]">
                        We take your privacy seriously. Here&apos;s how we protect your information.
                    </p>
                </motion.div>

                {/* Security Features */}
                <section>
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-4">
                        Security Features
                    </h3>
                    <div className="space-y-3">
                        {securityFeatures.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)]"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[var(--dc-text-primary)] mb-1">
                                            {feature.title}
                                        </h4>
                                        <p className="text-sm text-[var(--dc-text-muted)]">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* What We Store */}
                <section>
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-4">
                        What We Store (and Don&apos;t Store)
                    </h3>
                    <div className="p-4 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)]">
                        <div className="space-y-3">
                            {dataStored.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    {item.stored ? (
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    )}
                                    <span className={`text-sm ${item.stored ? 'text-[var(--dc-text-secondary)]' : 'text-red-400'}`}>
                                        {item.stored ? item.item : `Never stored: ${item.item}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Manual Entry Notice */}
                <section>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-start gap-3">
                            <Server className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-400 mb-1">
                                    100% Manual Entry
                                </h4>
                                <p className="text-sm text-[var(--dc-text-muted)]">
                                    Dominion Core never connects to your bank accounts. All financial data is entered manually by you.
                                    This means we have no access to your actual bank accounts, transactions, or balances.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Deletion */}
                <section>
                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-4">
                        Your Rights
                    </h3>
                    <div className="p-4 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)]">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-[var(--dc-text-primary)] mb-1">
                                    Delete Your Data
                                </h4>
                                <p className="text-sm text-[var(--dc-text-muted)] mb-3">
                                    You can request complete deletion of your account and all associated data at any time.
                                    Contact us and we&apos;ll remove everything within 48 hours.
                                </p>
                                <a
                                    href="mailto:support@dominiondesk.com?subject=Data Deletion Request"
                                    className="text-sm text-[var(--dc-primary)] hover:underline"
                                >
                                    Request data deletion →
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="text-center py-6">
                    <p className="text-[var(--dc-text-muted)] text-sm">
                        Questions about security?{' '}
                        <a href="mailto:support@dominiondesk.com" className="text-[var(--dc-primary)] hover:underline">
                            Contact us
                        </a>
                    </p>
                </section>
            </main>
        </div>
    );
}
