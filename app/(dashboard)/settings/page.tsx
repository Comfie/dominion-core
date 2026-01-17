'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Users, Pencil, Check, X, AlertTriangle, DollarSign, ShieldAlert, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Person } from '@/types/finance';
import { AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [settings, setSettings] = useState({
        monthlyIncome: '',
        monthlyBudget: '',
        payday: '25',
        currency: 'ZAR',
    });

    // Person management state
    const [persons, setPersons] = useState<Person[]>([]);
    const [newPersonName, setNewPersonName] = useState('');
    const [isAddingPerson, setIsAddingPerson] = useState(false);
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [editingPersonName, setEditingPersonName] = useState('');
    const [editingPersonBudget, setEditingPersonBudget] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchSettings();
            fetchPersons();
        }
    }, [status, router]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    monthlyIncome: data.monthlyIncome.toString(),
                    monthlyBudget: data.monthlyBudget?.toString() || '',
                    payday: data.payday.toString(),
                    currency: data.currency,
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPersons = async () => {
        try {
            const res = await fetch('/api/persons');
            if (res.ok) {
                const data = await res.json();
                setPersons(data);
            }
        } catch (err) {
            console.error('Error fetching persons:', err);
        }
    };

    const handleAddPerson = async () => {
        if (!newPersonName.trim()) return;

        setIsAddingPerson(true);
        try {
            const res = await fetch('/api/persons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPersonName.trim() }),
            });

            if (res.ok) {
                setNewPersonName('');
                fetchPersons();
            }
        } catch (err) {
            console.error('Error adding person:', err);
        } finally {
            setIsAddingPerson(false);
        }
    };

    const handleDeletePerson = async (id: string) => {
        try {
            await fetch('/api/persons', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setDeleteConfirmId(null);
            fetchPersons();
        } catch (err) {
            console.error('Error deleting person:', err);
        }
    };

    const handleEditPerson = async (id: string) => {
        if (!editingPersonName.trim()) return;

        try {
            await fetch('/api/persons', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: editingPersonName.trim(),
                    budgetLimit: editingPersonBudget ? parseFloat(editingPersonBudget) : null,
                }),
            });
            setEditingPersonId(null);
            setEditingPersonName('');
            setEditingPersonBudget('');
            fetchPersons();
        } catch (err) {
            console.error('Error updating person:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monthlyIncome: parseFloat(settings.monthlyIncome),
                    monthlyBudget: settings.monthlyBudget ? parseFloat(settings.monthlyBudget) : null,
                    payday: parseInt(settings.payday),
                    currency: settings.currency,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update settings');
            }

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--dc-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--dc-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 glass">
                <div className="px-4 py-4 flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--dc-text-primary)]">
                            Settings
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Configure your financial profile
                        </p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
                {/* Financial Profile */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <h2 className="text-xl font-semibold text-[var(--dc-text-primary)] mb-6">
                        Financial Profile
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Monthly Income */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--dc-text-secondary)] mb-2">
                                Monthly Income
                            </label>
                            <p className="text-xs text-[var(--dc-text-muted)] mb-3">
                                Your net monthly income after tax
                            </p>
                            <input
                                type="number"
                                step="0.01"
                                value={settings.monthlyIncome}
                                onChange={(e) => setSettings({ ...settings, monthlyIncome: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                required
                            />
                        </div>

                        {/* Payday */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--dc-text-secondary)] mb-2">
                                Payday
                            </label>
                            <p className="text-xs text-[var(--dc-text-muted)] mb-3">
                                Day of the month you receive your salary (1-31)
                            </p>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={settings.payday}
                                onChange={(e) => setSettings({ ...settings, payday: e.target.value })}
                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                                required
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--dc-text-secondary)] mb-2">
                                Currency
                            </label>
                            <select
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 px-4 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                            >
                                <option value="ZAR">ZAR (South African Rand)</option>
                                <option value="USD">USD (US Dollar)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="GBP">GBP (British Pound)</option>
                            </select>
                        </div>

                        {/* Monthly Budget Alert */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--dc-text-secondary)] mb-2">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    Global Monthly Budget
                                </div>
                            </label>
                            <p className="text-xs text-[var(--dc-text-muted)] mb-3">
                                Get alerted when total expenses approach or exceed this amount
                            </p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--dc-text-muted)]">R</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settings.monthlyBudget}
                                    onChange={(e) => setSettings({ ...settings, monthlyBudget: e.target.value })}
                                    placeholder="5000.00 (optional)"
                                    className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-3 pl-10 pr-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-amber-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Error/Success messages */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Save button */}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--dc-primary)] to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Family Members / Persons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-[var(--dc-primary)]" />
                        <h2 className="text-xl font-semibold text-[var(--dc-text-primary)]">
                            Family Members
                        </h2>
                    </div>
                    <p className="text-sm text-[var(--dc-text-muted)] mb-4">
                        Add family members to track expenses for each person
                    </p>

                    {/* Add new person */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            placeholder="e.g. Wife, Kids, Mom"
                            className="flex-1 bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-xl py-2 px-4 text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[var(--dc-primary)] transition-colors"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddPerson()}
                        />
                        <button
                            onClick={handleAddPerson}
                            disabled={isAddingPerson || !newPersonName.trim()}
                            className="px-4 py-2 rounded-xl bg-[var(--dc-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAddingPerson ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            Add
                        </button>
                    </div>

                    {/* Person list */}
                    {persons.length > 0 ? (
                        <div className="space-y-2">
                            {persons.map((person) => (
                                <div
                                    key={person.id}
                                    className="p-3 rounded-xl bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)]"
                                >
                                    {editingPersonId === person.id ? (
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editingPersonName}
                                                    onChange={(e) => setEditingPersonName(e.target.value)}
                                                    className="flex-1 bg-[var(--dc-bg-primary)] border border-[var(--dc-border)] rounded-lg py-1 px-3 text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                                                    autoFocus
                                                    onKeyPress={(e) => e.key === 'Enter' && handleEditPerson(person.id)}
                                                />
                                                <button
                                                    onClick={() => handleEditPerson(person.id)}
                                                    className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingPersonId(null); setEditingPersonName(''); setEditingPersonBudget(''); }}
                                                    className="p-2 rounded-lg hover:bg-[var(--dc-bg-elevated)] text-[var(--dc-text-muted)] transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--dc-text-muted)]">Budget R</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={editingPersonBudget}
                                                        onChange={(e) => setEditingPersonBudget(e.target.value)}
                                                        placeholder="Optional"
                                                        className="w-full bg-[var(--dc-bg-primary)] border border-amber-500/30 rounded-lg py-1.5 pl-20 pr-3 text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-amber-400 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[var(--dc-text-primary)]">{person.name}</span>
                                                {person.budgetLimit && person.budgetLimit > 0 && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <DollarSign className="w-3 h-3 text-amber-400" />
                                                        <span className="text-xs text-amber-400">
                                                            R {person.budgetLimit.toLocaleString()}/month
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingPersonId(person.id);
                                                        setEditingPersonName(person.name);
                                                        setEditingPersonBudget(person.budgetLimit?.toString() || '');
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-[var(--dc-bg-elevated)] text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(person.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--dc-text-muted)] text-center py-4">
                            No family members added yet
                        </p>
                    )}
                </motion.div>

                {/* Account Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6"
                >
                    <h2 className="text-xl font-semibold text-[var(--dc-text-primary)] mb-4">
                        Account
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-[var(--dc-text-muted)]">Name</p>
                            <p className="text-[var(--dc-text-primary)]">{session?.user?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--dc-text-muted)]">Email</p>
                            <p className="text-[var(--dc-text-primary)]">{session?.user?.email}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Security & Privacy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Link
                        href="/security"
                        className="card p-4 flex items-center justify-between hover:border-[var(--dc-primary)] transition-colors block"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--dc-text-primary)]">
                                    Security & Privacy
                                </h3>
                                <p className="text-sm text-[var(--dc-text-muted)]">
                                    Learn how we protect your data
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--dc-text-muted)]" />
                    </Link>
                </motion.div>

                {/* Danger Zone - Reset Account */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6 border-red-500/30"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        <h2 className="text-xl font-semibold text-red-400">
                            Danger Zone
                        </h2>
                    </div>
                    <p className="text-sm text-[var(--dc-text-muted)] mb-4">
                        Reset all financial data and start fresh. This will delete all obligations, payments, expenses, income, and family members. Your account and settings will be preserved.
                    </p>
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                    >
                        Reset Financial Data
                    </button>
                </motion.div>
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmId(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="card p-6 w-full max-w-sm"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-2">
                                        Remove Person
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-6">
                                        Are you sure you want to remove <span className="font-medium text-[var(--dc-text-primary)]">{persons.find(p => p.id === deleteConfirmId)?.name}</span>? This won&apos;t delete associated expenses.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-medium hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => deleteConfirmId && handleDeletePerson(deleteConfirmId)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Reset Confirmation Modal */}
                {showResetConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="card p-6 w-full max-w-sm border border-red-500/30"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                        <ShieldAlert className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-2">
                                        Reset All Data
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-4">
                                        This will permanently delete all your financial data. Type <span className="font-bold text-red-400">RESET</span> to confirm.
                                    </p>
                                    <input
                                        type="text"
                                        value={resetConfirmText}
                                        onChange={(e) => setResetConfirmText(e.target.value)}
                                        placeholder="Type RESET"
                                        className="w-full bg-[var(--dc-bg-secondary)] border border-red-500/30 rounded-xl py-2 px-4 text-center text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-red-500 mb-4"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-medium hover:bg-[var(--dc-bg-elevated)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (resetConfirmText !== 'RESET') return;
                                                setIsResetting(true);
                                                try {
                                                    const res = await fetch('/api/account/reset', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ confirmation: 'RESET' }),
                                                    });
                                                    if (res.ok) {
                                                        setShowResetConfirm(false);
                                                        setResetConfirmText('');
                                                        fetchPersons();
                                                        setSuccess('All financial data has been reset!');
                                                        setTimeout(() => setSuccess(''), 3000);
                                                    }
                                                } catch (err) {
                                                    console.error('Error resetting:', err);
                                                } finally {
                                                    setIsResetting(false);
                                                }
                                            }}
                                            disabled={resetConfirmText !== 'RESET' || isResetting}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isResetting ? 'Resetting...' : 'Reset Data'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
