'use client';

import { useSession, signOut } from 'next-auth/react';
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
import { GlassCard } from '@/components/ui/GlassCard';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
      <div className="min-h-screen pb-safe-area-bottom">
        {/* Header - Mobile App Style */}
        <header className="sticky top-0 z-40 bg-[var(--dc-bg-primary)]/80 backdrop-blur-md border-b border-[var(--dc-border)] pt-safe">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--dc-primary)] to-[var(--dc-primary-soft)] flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg font-bold text-[var(--dc-text-primary)]"
                >
                  Dashboard
                </motion.h1>
                <p className="text-xs text-[var(--dc-text-muted)]">
                  {format(new Date(), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-[var(--dc-bg-elevated)] flex items-center justify-center relative hover:bg-[var(--dc-bg-secondary)] transition-colors">
                <Bell className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                {upcomingPayments.filter(p => !p.isPaid && p.daysUntil <= 3).length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--dc-danger)] border border-[var(--dc-bg-elevated)] shadow-sm">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--dc-danger)] opacity-75"></span>
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-[var(--dc-border)] hover:border-[var(--dc-primary)] transition-colors"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--dc-bg-elevated)] flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--dc-text-secondary)]" />
                    </div>
                  )}
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] shadow-xl overflow-hidden glass">
                      <div className="px-4 py-3 border-b border-[var(--dc-border)]">
                        <p className="text-sm font-medium text-[var(--dc-text-primary)] truncate">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-[var(--dc-text-muted)] truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => router.push('/settings')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--dc-text-secondary)] hover:text-[var(--dc-text-primary)] hover:bg-[var(--dc-bg-elevated)] rounded-lg transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={() => signOut()}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="px-4 py-6 space-y-6">
          {!hasData ? (
            /* Empty state */
            <GlassCard
              className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]"
              gradient
            >
              <div className="w-20 h-20 rounded-full bg-[var(--dc-primary)]/10 flex items-center justify-center mb-6 shadow-glow">
                <Plus className="w-10 h-10 text-[var(--dc-primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--dc-text-primary)] mb-3">
                Welcome to Dominion
              </h2>
              <p className="text-[var(--dc-text-muted)] mb-8 max-w-xs mx-auto leading-relaxed">
                Take control of your finances. Start by adding your first obligation.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-[var(--dc-primary)] to-[var(--dc-accent)] text-white font-semibold shadow-lg shadow-[var(--dc-primary)]/25 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Obligation</span>
              </motion.button>
            </GlassCard>
          ) : (
            <>
              {/* Budget Alerts */}
              <BudgetAlerts
                expenses={expenses}
                persons={persons}
                settings={settings}
              />

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FreeCashFlow
                  monthlyIncome={settings?.monthlyIncome || 0}
                  obligations={obligations}
                  expenses={expenses}
                  incomes={incomes}
                />

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

        {/* Expandable FAB Menu - Adjusted position for Bottom Nav */}
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 pointer-events-none">
          {/* Sub-actions */}
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            {isFabOpen && (
              <>
                <motion.button
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  onClick={() => { setIsIncomeModalOpen(true); setIsFabOpen(false); }}
                  className="flex items-center gap-3 pr-2 pl-4 py-2"
                >
                  <span className="text-sm font-medium bg-[var(--dc-bg-elevated)] px-3 py-1 rounded-lg text-[var(--dc-text-primary)] shadow-md">Add Income</span>
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </motion.button>

                <motion.button
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => { setIsExpenseModalOpen(true); setIsFabOpen(false); }}
                  className="flex items-center gap-3 pr-2 pl-4 py-2"
                >
                  <span className="text-sm font-medium bg-[var(--dc-bg-elevated)] px-3 py-1 rounded-lg text-[var(--dc-text-primary)] shadow-md">Add Expense</span>
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg text-white">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </motion.button>

                <motion.button
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => { setIsAddModalOpen(true); setIsFabOpen(false); }}
                  className="flex items-center gap-3 pr-2 pl-4 py-2"
                >
                  <span className="text-sm font-medium bg-[var(--dc-bg-elevated)] px-3 py-1 rounded-lg text-[var(--dc-text-primary)] shadow-md">Add Obligation</span>
                  <div className="w-10 h-10 rounded-full bg-[var(--dc-primary)] flex items-center justify-center shadow-lg text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </motion.button>

                <motion.button
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => { setIsScanModalOpen(true); setIsFabOpen(false); }}
                  className="flex items-center gap-3 pr-2 pl-4 py-2"
                >
                  <span className="text-sm font-medium bg-[var(--dc-bg-elevated)] px-3 py-1 rounded-lg text-[var(--dc-text-primary)] shadow-md">Scan Receipt</span>
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                </motion.button>
              </>
            )}
          </div>

          {/* Main FAB Button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full shadow-lg shadow-[var(--dc-primary)]/30 flex items-center justify-center transition-all duration-300 pointer-events-auto ${isFabOpen
              ? 'bg-[var(--dc-bg-card)] border border-[var(--dc-border)]'
              : 'bg-gradient-to-br from-[var(--dc-primary)] to-[var(--dc-accent)]'
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
