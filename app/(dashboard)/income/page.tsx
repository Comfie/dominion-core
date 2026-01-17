'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, TrendingUp, Check, X, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Income, incomeSourceConfig, IncomeSource } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { format, subMonths, addMonths } from 'date-fns';
import { AddIncomeModal } from '@/components/modals/AddIncomeModal';

export default function IncomePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [filterSource, setFilterSource] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchData();
        }
    }, [status, router, selectedMonth]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const monthStr = format(selectedMonth, 'yyyy-MM');
            const res = await fetch(`/api/incomes?month=${monthStr}`);

            if (res.ok) {
                const data = await res.json();
                setIncomes(data.map((i: any) => ({
                    ...i,
                    amount: Number(i.amount),
                    date: new Date(i.date),
                    createdAt: new Date(i.createdAt),
                })));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting income:', error);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editingName.trim()) return;
        try {
            await fetch(`/api/incomes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingName.trim() }),
            });
            setEditingId(null);
            setEditingName('');
            fetchData();
        } catch (error) {
            console.error('Error updating income:', error);
        }
    };

    // Filter incomes
    const filteredIncomes = incomes.filter(i => {
        if (filterSource && i.source !== filterSource) return false;
        return true;
    });

    // Calculate totals
    const totalAmount = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const recurringTotal = filteredIncomes.filter(i => i.isRecurring).reduce((sum, i) => sum + i.amount, 0);
    const oneTimeTotal = filteredIncomes.filter(i => !i.isRecurring).reduce((sum, i) => sum + i.amount, 0);
    const incomeBySource = filteredIncomes.reduce((acc, i) => {
        acc[i.source] = (acc[i.source] || 0) + i.amount;
        return acc;
    }, {} as Record<string, number>);

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--dc-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
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
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-[var(--dc-text-primary)]">
                            Extra Income
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Side hustles & additional earnings
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </header>

            <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
                {/* Month Selector */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                        className="p-2 rounded-lg bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        <span className="text-lg font-semibold text-[var(--dc-text-primary)]">
                            {format(selectedMonth, 'MMMM yyyy')}
                        </span>
                    </div>
                    <button
                        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                        className="p-2 rounded-lg bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--dc-text-secondary)] rotate-180" />
                    </button>
                </div>

                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--dc-text-muted)]">Total Extra Income</p>
                                <p className="text-2xl font-bold text-green-400">
                                    +{formatCurrency(totalAmount)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-[var(--dc-text-muted)]">Sources</p>
                            <p className="text-xl font-semibold text-[var(--dc-text-primary)]">
                                {filteredIncomes.length}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-[var(--dc-text-muted)]">Recurring</span>
                            </div>
                            <p className="text-sm font-semibold text-[var(--dc-text-primary)]">
                                {formatCurrency(recurringTotal)}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--dc-bg-secondary)]">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-[var(--dc-text-muted)]">One-time</span>
                            </div>
                            <p className="text-sm font-semibold text-[var(--dc-text-primary)]">
                                {formatCurrency(oneTimeTotal)}
                            </p>
                        </div>
                    </div>

                    {/* Source breakdown */}
                    {Object.keys(incomeBySource).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {Object.entries(incomeBySource)
                                .sort(([, a], [, b]) => b - a)
                                .map(([source, amount]) => {
                                    const config = incomeSourceConfig[source as IncomeSource];
                                    return (
                                        <div
                                            key={source}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--dc-bg-primary)] flex items-center gap-2"
                                        >
                                            <span className="text-xs">{config?.icon || '💰'}</span>
                                            <span className="text-xs text-[var(--dc-text-secondary)]">
                                                {config?.label || source}
                                            </span>
                                            <span className="text-xs font-medium text-green-400">
                                                +{formatCurrency(amount)}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </motion.div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                    >
                        <option value="">All Sources</option>
                        {Object.entries(incomeSourceConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.icon} {config.label}</option>
                        ))}
                    </select>
                </div>

                {/* Income List */}
                <div className="space-y-2">
                    {filteredIncomes.length > 0 ? (
                        filteredIncomes.map((income) => {
                            const config = incomeSourceConfig[income.source as IncomeSource];
                            return (
                                <motion.div
                                    key={income.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="card p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                                            {config?.icon || '💰'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {editingId === income.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        className="flex-1 bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-lg py-1 px-2 text-sm text-[var(--dc-text-primary)]"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleEdit(income.id)}
                                                        className="p-1 text-green-400"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 text-[var(--dc-text-muted)]"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                                                        {income.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)]">
                                                        <span>{format(income.date, 'd MMM')}</span>
                                                        <span>•</span>
                                                        <span>{config?.label || income.source}</span>
                                                        {income.isRecurring && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-blue-400">Recurring</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-green-400">
                                                +{formatCurrency(income.amount)}
                                            </span>
                                            {editingId !== income.id && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(income.id);
                                                            setEditingName(income.name);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--dc-bg-secondary)] text-[var(--dc-text-muted)]"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(income.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-[var(--dc-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--dc-text-muted)]">No extra income for this month</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-block mt-4 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium"
                            >
                                Add Income
                            </button>
                        </div>
                    )}
                </div>
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
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="card p-6 w-full max-w-sm"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--dc-text-primary)] mb-2">
                                        Delete Income
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-6">
                                        Are you sure you want to delete <span className="font-medium text-[var(--dc-text-primary)]">{incomes.find(i => i.id === deleteConfirmId)?.name}</span>?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="flex-1 py-2.5 rounded-xl bg-[var(--dc-bg-secondary)] text-[var(--dc-text-secondary)] font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deleteConfirmId)}
                                            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Income Modal */}
            <AddIncomeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}
