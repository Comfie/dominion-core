// Dominion Core - TypeScript Types for Finance

export type Category =
  | 'HOUSING'
  | 'DEBT'
  | 'LIVING'
  | 'SAVINGS'
  | 'INSURANCE'
  | 'UTILITIES'
  | 'TRANSPORT'
  | 'GROCERIES'
  | 'DINING'
  | 'ENTERTAINMENT'
  | 'SHOPPING'
  | 'OTHER';

export type IncomeSource =
  | 'SALARY'
  | 'FREELANCE'
  | 'SIDE_HUSTLE'
  | 'SALE'
  | 'RENTAL'
  | 'GIFT'
  | 'INVESTMENT'
  | 'REFUND'
  | 'OTHER';

export type AdjustmentReason =
  | 'DISCOUNT'
  | 'INCREASE'
  | 'DECREASE'
  | 'PARTIAL'
  | 'ERROR';

// Person - family member for expense tracking
export interface Person {
  id: string;
  name: string;
  budgetLimit?: number; // Monthly budget limit for this person
  createdAt: Date;
}

export interface Obligation {
  id: string;
  name: string;
  provider: string;
  category: Category;
  amount: number;
  totalBalance?: number;
  interestRate?: number;
  debitOrderDate: number;
  isUncompromised: boolean;
  isActive: boolean;
  notes?: string;
  personId?: string;
  person?: Person;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  obligationId: string;
  amount: number;
  expectedAmount?: number;
  adjustmentReason?: AdjustmentReason;
  paidAt: Date;
  month: string;
  notes?: string;
  createdAt: Date;
}

// Expense - one-time variable spending
export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: Date;
  personId?: string;
  person?: Person;
  notes?: string;
  createdAt: Date;
}

// Income - extra income beyond salary
export interface Income {
  id: string;
  name: string;
  amount: number;
  source: IncomeSource;
  date: Date;
  isRecurring: boolean;
  notes?: string;
  createdAt: Date;
}

export interface Receipt {
  id: string;
  imageUrl: string;
  vendor?: string;
  amount?: number;
  category?: Category;
  date?: Date;
  description?: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface MonthlySnapshot {
  id: string;
  month: string;
  totalIncome: number;
  totalUncompromised: number;
  totalVariable: number;
  totalSavings: number;
  freeCashFlow: number;
  createdAt: Date;
}

export interface Settings {
  id: string;
  monthlyIncome: number;
  monthlyBudget?: number; // Global monthly expense budget
  payday: number;
  currency: string;
}

// Dashboard computed values
export interface DashboardMetrics {
  burnRate: number;           // Total uncompromised costs
  totalDebt: number;          // Sum of all debt balances
  freeCashFlow: number;       // Income - all expenses
  discountStatus: DiscountStatus;
  upcomingPayments: UpcomingPayment[];
}

export interface DiscountStatus {
  isSecured: boolean;
  levyAmount: number;
  paidDate?: Date;
  dueDate: Date;
  daysRemaining: number;
}

export interface UpcomingPayment {
  obligation: Obligation;
  dueDate: Date;
  daysUntil: number;
  isPaid: boolean;
}

// Category configuration for UI
export const categoryConfig: Record<Category, { label: string; color: string; icon: string }> = {
  HOUSING: { label: 'Housing', color: '#6366f1', icon: 'Home' },
  DEBT: { label: 'Debt', color: '#ef4444', icon: 'CreditCard' },
  LIVING: { label: 'Living', color: '#10b981', icon: 'ShoppingBag' },
  SAVINGS: { label: 'Savings', color: '#22c55e', icon: 'PiggyBank' },
  INSURANCE: { label: 'Insurance', color: '#8b5cf6', icon: 'Shield' },
  UTILITIES: { label: 'Utilities', color: '#f59e0b', icon: 'Zap' },
  TRANSPORT: { label: 'Transport', color: '#3b82f6', icon: 'Car' },
  GROCERIES: { label: 'Groceries', color: '#14b8a6', icon: 'ShoppingCart' },
  DINING: { label: 'Dining', color: '#f97316', icon: 'UtensilsCrossed' },
  ENTERTAINMENT: { label: 'Entertainment', color: '#ec4899', icon: 'Film' },
  SHOPPING: { label: 'Shopping', color: '#a855f7', icon: 'ShoppingBag' },
  OTHER: { label: 'Other', color: '#6b7280', icon: 'MoreHorizontal' },
};

// Income source configuration for UI
export const incomeSourceConfig: Record<IncomeSource, { label: string; color: string; icon: string }> = {
  SALARY: { label: 'Salary', color: '#22c55e', icon: '💼' },
  FREELANCE: { label: 'Freelance', color: '#3b82f6', icon: '💻' },
  SIDE_HUSTLE: { label: 'Side Hustle', color: '#8b5cf6', icon: '🚀' },
  SALE: { label: 'Sale', color: '#f59e0b', icon: '🏷️' },
  RENTAL: { label: 'Rental', color: '#6366f1', icon: '🏠' },
  GIFT: { label: 'Gift', color: '#ec4899', icon: '🎁' },
  INVESTMENT: { label: 'Investment', color: '#10b981', icon: '📈' },
  REFUND: { label: 'Refund', color: '#14b8a6', icon: '↩️' },
  OTHER: { label: 'Other', color: '#6b7280', icon: '💰' },
};
