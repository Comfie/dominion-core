'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Filter, Calendar, Users, ShoppingBag, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { Expense, Person, categoryConfig, Category } from '@/types/finance';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { BankStatementImport } from '@/components/modals/BankStatementImport';

export default function ExpensesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterPerson, setFilterPerson] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingCategory, setEditingCategory] = useState<string>('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
            const [expensesRes, personsRes] = await Promise.all([
                fetch(`/api/expenses?month=${monthStr}`),
                fetch('/api/persons'),
            ]);

            if (expensesRes.ok) {
                const data = await expensesRes.json();
                setExpenses(data.map((e: any) => ({
                    ...e,
                    amount: Number(e.amount),
                    date: new Date(e.date),
                    createdAt: new Date(e.createdAt),
                })));
            }

            if (personsRes.ok) {
                const data = await personsRes.json();
                setPersons(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editingName.trim()) return;
        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingName.trim(),
                    category: editingCategory,
                }),
            });
            setEditingId(null);
            setEditingName('');
            setEditingCategory('');
            fetchData();
        } catch (error) {
            console.error('Error updating expense:', error);
        }
    };

    const handleQuickCategoryChange = async (id: string, category: string) => {
        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category }),
            });
            fetchData();
        } catch (error) {
            console.error('Error updating expense category:', error);
        }
    };

    // Filter expenses
    const filteredExpenses = expenses.filter(e => {
        if (filterCategory && e.category !== filterCategory) return false;
        if (filterPerson && e.personId !== filterPerson) return false;
        return true;
    });

    // Calculate totals
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory = filteredExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
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
                            Expenses
                        </h1>
                        <p className="text-xs text-[var(--dc-text-muted)]">
                            Track your spending
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] flex items-center justify-center hover:border-[var(--dc-primary)] transition-colors"
                            title="Import bank statement"
                        >
                            <Upload className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-[var(--dc-primary)] flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5 text-white" />
                        </button>
                    </div>
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
                        <Calendar className="w-5 h-5 text-[var(--dc-primary)]" />
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
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--dc-text-muted)]">Total Spent</p>
                                <p className="text-2xl font-bold text-orange-400">
                                    R {totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-[var(--dc-text-muted)]">Transactions</p>
                            <p className="text-xl font-semibold text-[var(--dc-text-primary)]">
                                {filteredExpenses.length}
                            </p>
                        </div>
                    </div>

                    {/* Category breakdown */}
                    {Object.keys(expensesByCategory).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(expensesByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 4)
                                .map(([cat, amount]) => {
                                    const config = categoryConfig[cat as Category];
                                    return (
                                        <div
                                            key={cat}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--dc-bg-secondary)] flex items-center gap-2"
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: config.color }}
                                            />
                                            <span className="text-xs text-[var(--dc-text-secondary)]">
                                                {config.label}
                                            </span>
                                            <span className="text-xs font-medium text-[var(--dc-text-primary)]">
                                                R {amount.toLocaleString()}
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
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                    >
                        <option value="">All Categories</option>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {persons.length > 0 && (
                        <select
                            value={filterPerson}
                            onChange={(e) => setFilterPerson(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                        >
                            <option value="">All People</option>
                            {persons.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Expenses List */}
                <div className="space-y-2">
                    {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((expense) => {
                            const config = categoryConfig[expense.category];
                            return (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="card p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: config.color }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {editingId === expense.id ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            className="flex-1 bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-lg py-1 px-2 text-sm text-[var(--dc-text-primary)]"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleEdit(expense.id)}
                                                            className="p-1 text-green-400"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingId(null); setEditingCategory(''); }}
                                                            className="p-1 text-[var(--dc-text-muted)]"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={editingCategory}
                                                        onChange={(e) => setEditingCategory(e.target.value)}
                                                        className="w-full bg-[var(--dc-bg-secondary)] border border-[var(--dc-border)] rounded-lg py-1 px-2 text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[var(--dc-primary)]"
                                                    >
                                                        {Object.entries(categoryConfig).map(([key, cfg]) => (
                                                            <option key={key} value={key}>{cfg.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                                                        {expense.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)]">
                                                        <span>{format(expense.date, 'd MMM')}</span>
                                                        <span>•</span>
                                                        <select
                                                            value={expense.category}
                                                            onChange={(e) => handleQuickCategoryChange(expense.id, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-transparent text-[var(--dc-text-secondary)] cursor-pointer focus:outline-none hover:text-[var(--dc-primary)] transition-colors"
                                                            style={{ color: config.color }}
                                                        >
                                                            {Object.entries(categoryConfig).map(([key, cfg]) => (
                                                                <option key={key} value={key}>{cfg.label}</option>
                                                            ))}
                                                        </select>
                                                        {expense.person && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-purple-400">{expense.person.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[var(--dc-text-primary)]">
                                                R {expense.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                            </span>
                                            {editingId !== expense.id && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(expense.id);
                                                            setEditingName(expense.name);
                                                            setEditingCategory(expense.category);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--dc-bg-secondary)] text-[var(--dc-text-muted)]"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(expense.id)}
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
                            <ShoppingBag className="w-12 h-12 text-[var(--dc-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--dc-text-muted)]">No expenses for this month</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-block mt-4 px-4 py-2 rounded-xl bg-[var(--dc-primary)] text-white text-sm font-medium"
                            >
                                Add Expense
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
                                        Delete Expense
                                    </h3>
                                    <p className="text-sm text-[var(--dc-text-muted)] mb-6">
                                        Are you sure you want to delete <span className="font-medium text-[var(--dc-text-primary)]">{expenses.find(e => e.id === deleteConfirmId)?.name}</span>?
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

            {/* Add Expense Modal */}
            <AddExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            {/* Bank Statement Import Modal */}
            {isImportModalOpen && (
                <BankStatementImport
                    onSuccess={fetchData}
                    onClose={() => setIsImportModalOpen(false)}
                />
            )}
        </div>
    );
}
