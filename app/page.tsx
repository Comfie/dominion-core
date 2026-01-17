'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Plus, Upload, LogOut, User, Settings as SettingsIcon, X, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react';
import {
  DiscountSafety,
  BurnRate,
  DebtProgress,
  CashflowTimeline,
  FreeCashFlow,
  AiInsights
} from '@/components/dashboard';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { AddObligationModal } from '@/components/modals/AddObligationModal';
import { EditObligationModal } from '@/components/modals/EditObligationModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ScanReceiptModal } from '@/components/modals/ScanReceiptModal';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { AddIncomeModal } from '@/components/modals/AddIncomeModal';
import { Obligation, Payment, Settings as SettingsType, Expense, Income, Person } from '@/types/finance';
import { getDiscountStatus, getUpcomingPayments } from '@/lib/calculations';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
  const [paymentObligation, setPaymentObligation] = useState<Obligation | null>(null);
  const [scannedExpenseData, setScannedExpenseData] = useState<{
    name?: string;
    amount?: number;
    category?: string;
    date?: string;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const currentMonth = format(new Date(), 'yyyy-MM');
      const [obligationsRes, paymentsRes, settingsRes, expensesRes, incomesRes, personsRes] = await Promise.all([
        fetch('/api/obligations'),
        fetch('/api/payments'),
        fetch('/api/settings'),
        fetch(`/api/expenses?month=${currentMonth}`),
        fetch(`/api/incomes?month=${currentMonth}`),
        fetch('/api/persons'),
      ]);

      if (obligationsRes.ok) {
        const obligationsData = await obligationsRes.json();
        setObligations(obligationsData.map((o: any) => ({
          ...o,
          amount: Number(o.amount),
          totalBalance: o.totalBalance ? Number(o.totalBalance) : undefined,
          interestRate: o.interestRate ? Number(o.interestRate) : undefined,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
        })));
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.map((p: any) => ({
          ...p,
          amount: Number(p.amount),
          paidAt: new Date(p.paidAt),
          createdAt: new Date(p.createdAt),
        })));
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings({
          ...settingsData,
          monthlyIncome: Number(settingsData.monthlyIncome),
        });
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData.map((e: any) => ({
          ...e,
          amount: Number(e.amount),
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
        })));
      }

      if (incomesRes.ok) {
        const incomesData = await incomesRes.json();
        setIncomes(incomesData.map((i: any) => ({
          ...i,
          amount: Number(i.amount),
          date: new Date(i.date),
          createdAt: new Date(i.createdAt),
        })));
      }

      if (personsRes.ok) {
        const personsData = await personsRes.json();
        setPersons(personsData.map((p: any) => ({
          ...p,
          budgetLimit: p.budgetLimit ? Number(p.budgetLimit) : undefined,
          createdAt: new Date(p.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth or fetching data
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dc-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--dc-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--dc-text-muted)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Calculate derived data
  const levyObligation = obligations.find(o => o.name.toLowerCase().includes('lev'));
  const discountStatus = getDiscountStatus(levyObligation, payments, new Date());
  const upcomingPayments = getUpcomingPayments(
    obligations,
    payments,
    settings?.payday || 25,
    new Date()
  );

  // Show empty state if no data
  const hasData = obligations.length > 0 || (settings?.monthlyIncome || 0) > 0;

  return (
    <>
      <div className="min-h-screen bg-[var(--dc-bg-primary)] pb-safe-area-bottom">
        {/* Header */}
        <header className="sticky top-0 z-50 glass">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center">
                <Menu className="w-5 h-5 text-[var(--dc-text-secondary)]" />
              </button>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-bold gradient-text"
                >
                  Dominion Core
                </motion.h1>
                <p className="text-xs text-[var(--dc-text-muted)]">
                  {format(new Date(), 'EEEE, d MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-[var(--dc-bg-card)] flex items-center justify-center relative">
                <Bell className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                {upcomingPayments.filter(p => !p.isPaid && p.daysUntil <= 3).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {upcomingPayments.filter(p => !p.isPaid && p.daysUntil <= 3).length}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative group">
                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--dc-primary)] to-purple-600 flex items-center justify-center">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-12 w-48 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-[var(--dc-border)]">
                    <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-[var(--dc-text-muted)] truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-secondary)] transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => router.push('/api/auth/signout')}
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-[var(--dc-bg-secondary)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome message */}
        <div className="px-4 py-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[var(--dc-text-secondary)]"
          >
            Welcome back, <span className="text-[var(--dc-text-primary)] font-medium">{session?.user?.name?.split(' ')[0] || 'there'}</span>
          </motion.p>
        </div>

        {/* Main content */}
        <main className="px-4 py-2 space-y-4">
          {!hasData ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--dc-primary)]/20 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-[var(--dc-primary)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--dc-text-primary)] mb-2">
                Get Started
              </h2>
              <p className="text-[var(--dc-text-muted)] mb-6">
                Add your first obligation to start tracking your finances
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--dc-primary)] to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Add Obligation
              </button>
            </motion.div>
          ) : (
            <>
              {/* Budget Alerts */}
              <BudgetAlerts
                expenses={expenses}
                persons={persons}
                settings={settings}
              />


              {/* Discount Safety - Hidden for now, not relevant for all users */}
              {/* {levyObligation && <DiscountSafety status={discountStatus} />} */}

              {/* Two column grid on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Cash Flow */}
                <FreeCashFlow
                  monthlyIncome={settings?.monthlyIncome || 0}
                  obligations={obligations}
                  expenses={expenses}
                  incomes={incomes}
                />

                {/* Burn Rate */}
                <BurnRate
                  obligations={obligations}
                  onEditObligation={setEditingObligation}
                  onRecordPayment={setPaymentObligation}
                />
              </div>

              {/* Debt Progress - Full width */}
              {obligations.some(o => o.totalBalance && o.totalBalance > 0) && (
                <DebtProgress obligations={obligations} />
              )}

              {/* Timeline and AI Insights side by side on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CashflowTimeline
                  upcomingPayments={upcomingPayments}
                  expenses={expenses}
                  payday={settings?.payday || 25}
                />
                <AiInsights />
              </div>
            </>
          )}
        </main>

        {/* Expandable FAB Menu */}
        <div className="fixed bottom-6 right-4 flex flex-col items-end gap-3">
          {/* Sub-actions - shown when FAB is open */}
          {isFabOpen && (
            <>
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                onClick={() => { setIsIncomeModalOpen(true); setIsFabOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50 text-green-400"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Add Income</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: 0.05 }}
                onClick={() => { setIsExpenseModalOpen(true); setIsFabOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-medium">Add Expense</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: 0.1 }}
                onClick={() => { setIsAddModalOpen(true); setIsFabOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-400"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Add Obligation</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: 0.15 }}
                onClick={() => { setIsScanModalOpen(true); setIsFabOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Scan Receipt</span>
              </motion.button>
            </>
          )}

          {/* Main FAB Button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isFabOpen
              ? 'bg-[var(--dc-bg-card)] border border-[var(--dc-border)]'
              : 'bg-gradient-to-br from-[var(--dc-primary)] to-purple-600 shadow-purple-500/30'
              }`}
          >
            {isFabOpen ? (
              <X className="w-6 h-6 text-[var(--dc-text-secondary)]" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>
      </div>

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

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentObligation}
        onClose={() => setPaymentObligation(null)}
        onSuccess={fetchData}
        obligation={paymentObligation}
      />

      {/* Scan Receipt Modal */}
      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={(data) => {
          // Store scanned data and open expense modal
          setScannedExpenseData({
            name: data.storeName,
            amount: data.total,
            category: data.category,
            date: data.date,
          });
          setIsScanModalOpen(false);
          setIsExpenseModalOpen(true);
        }}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setScannedExpenseData(null);
        }}
        onSuccess={fetchData}
        initialData={scannedExpenseData}
      />

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={fetchData}
      />
    </>
  );
}
