'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, CreditCard, Check, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Obligation, Payment, categoryConfig, Category } from '@/types/finance';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { AddObligationModal } from '@/components/modals/AddObligationModal';
import { EditObligationModal } from '@/components/modals/EditObligationModal';

export default function ObligationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchData();
        }
    }, [status, router]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [obligationsRes, paymentsRes] = await Promise.all([
                fetch('/api/obligations'),
                fetch('/api/payments'),
            ]);

            if (obligationsRes.ok) {
                const data = await obligationsRes.json();
                setObligations(data.map((o: any) => ({
                    ...o,
                    amount: Number(o.amount),
                    totalBalance: o.totalBalance ? Number(o.totalBalance) : undefined,
                    interestRate: o.interestRate ? Number(o.interestRate) : undefined,
                    createdAt: new Date(o.createdAt),
                    updatedAt: new Date(o.updatedAt),
                })));
            }

            if (paymentsRes.ok) {
                const data = await paymentsRes.json();
                setPayments(data.map((p: any) => ({
                    ...p,
                    amount: Number(p.amount),
                    paidAt: new Date(p.paidAt),
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
            await fetch(`/api/obligations/${id}`, { method: 'DELETE' });
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting obligation:', error);
        }
    };

    // Check if obligation was paid this month
    const isPaidThisMonth = (obligationId: string) => {
        const now = new Date();
        return payments.some(p =>
            p.obligationId === obligationId &&
            p.paidAt.getMonth() === now.getMonth() &&
            p.paidAt.getFullYear() === now.getFullYear()
        );
    };

    // Filter obligations
    const filteredObligations = obligations.filter(o => {
        if (filterCategory && o.category !== filterCategory) return false;
        if (filterType === 'fixed' && !o.isUncompromised) return false;
        if (filterType === 'variable' && o.isUncompromised) return false;
        if (filterType === 'debt' && !o.totalBalance) return false;
        return true;
    });

    // Calculate totals
    const totalMonthly = filteredObligations.reduce((sum, o) => sum + o.amount, 0);
    const fixedCosts = filteredObligations.filter(o => o.isUncompromised).reduce((sum, o) => sum + o.amount, 0);
    const variableCosts = filteredObligations.filter(o => !o.isUncompromised).reduce((sum, o) => sum + o.amount, 0);
    const totalDebt = filteredObligations.reduce((sum, o) => sum + (o.totalBalance || 0), 0);

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
                            Obligations
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Recurring monthly payments
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-[var(--dc-primary)] flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </header>

            <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4"
                    >
                        <p className="text-xs text-[var(--dc-text-muted)] mb-1">Monthly Total</p>
                        <p className="text-xl font-bold text-[var(--dc-text-primary)]">
                            {formatCurrency(totalMonthly)}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="card p-4"
                    >
                        <p className="text-xs text-[var(--dc-text-muted)] mb-1">Total Debt</p>
                        <p className="text-xl font-bold text-red-400">
                            {formatCurrency(totalDebt)}
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="card p-3">
                        <p className="text-xs text-[var(--dc-text-muted)]">Fixed Costs</p>
                        <p className="text-lg font-semibold text-purple-400">{formatCurrency(fixedCosts)}</p>
                    </div>
                    <div className="card p-3">
                        <p className="text-xs text-[var(--dc-text-muted)]">Variable Costs</p>
                        <p className="text-lg font-semibold text-amber-400">{formatCurrency(variableCosts)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                    >
                        <option value="">All Categories</option>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                    >
                        <option value="">All Types</option>
                        <option value="fixed">Fixed Costs</option>
                        <option value="variable">Variable Costs</option>
                        <option value="debt">With Debt Balance</option>
                    </select>
                </div>

                {/* Obligations List */}
                <div className="space-y-2">
                    {filteredObligations.length > 0 ? (
                        filteredObligations.map((obligation) => {
                            const config = categoryConfig[obligation.category];
                            const paid = isPaidThisMonth(obligation.id);

                            return (
                                <motion.div
                                    key={obligation.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="card p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <CreditCard className="w-5 h-5" style={{ color: config.color }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                                                    {obligation.name}
                                                </p>
                                                {paid && (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                                        Paid
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)]">
                                                <span>{config.label}</span>
                                                <span>•</span>
                                                <span>Due: {obligation.debitOrderDate}{['st', 'nd', 'rd'][obligation.debitOrderDate - 1] || 'th'}</span>
                                                {obligation.isUncompromised && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-purple-400">Essential</span>
                                                    </>
                                                )}
                                            </div>
                                            {obligation.totalBalance && obligation.totalBalance > 0 && (
                                                <div className="mt-1">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-[var(--dc-text-muted)]">Balance</span>
                                                        <span className="text-red-400">{formatCurrency(obligation.totalBalance)}</span>
                                                    </div>
                                                    <div className="h-1 bg-[var(--dc-bg-secondary)] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                                            style={{
                                                                width: `${Math.min(100, ((obligation.totalBalance - (obligation.totalBalance)) / obligation.totalBalance) * 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-lg font-bold text-[var(--dc-text-primary)]">
                                                {formatCurrency(obligation.amount)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingObligation(obligation)}
                                                    className="p-1.5 rounded-lg hover:bg-[var(--dc-bg-secondary)] text-[var(--dc-text-muted)]"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(obligation.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--dc-text-muted)] hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 text-[var(--dc-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--dc-text-muted)]">No obligations found</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-block mt-4 px-4 py-2 rounded-xl bg-[var(--dc-primary)] text-white text-sm font-medium"
                            >
                                Add Obligation
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
                                        Delete Obligation
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-6">
                                        Are you sure you want to delete <span className="font-medium text-[var(--dc-text-primary)]">{obligations.find(o => o.id === deleteConfirmId)?.name}</span>? This will also delete all associated payments.
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

            {/* Add Obligation Modal */}
            <AddObligationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            {/* Edit Obligation Modal */}
            <EditObligationModal
                isOpen={!!editingObligation}
                onClose={() => setEditingObligation(null)}
                onSuccess={fetchData}
                obligation={editingObligation}
            />
        </div>
    );
}
