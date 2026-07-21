import { z } from 'zod';

// Prisma enums mirrored here (see prisma/schema.prisma) since zod schemas
// can't import directly from the generated Prisma client types.
export const categoryEnum = z.enum([
  'HOUSING',
  'DEBT',
  'LIVING',
  'SAVINGS',
  'INSURANCE',
  'UTILITIES',
  'TRANSPORT',
  'GROCERIES',
  'OTHER',
  'DINING',
  'ENTERTAINMENT',
  'SHOPPING',
]);

export const incomeSourceEnum = z.enum([
  'SALARY',
  'FREELANCE',
  'SIDE_HUSTLE',
  'SALE',
  'RENTAL',
  'GIFT',
  'INVESTMENT',
  'REFUND',
  'OTHER',
]);

export const goalCategoryEnum = z.enum([
  'EMERGENCY_FUND',
  'HOLIDAY',
  'CAR',
  'HOME',
  'EDUCATION',
  'WEDDING',
  'RETIREMENT',
  'OTHER',
]);

const positiveNumber = z.number().positive().finite();
const nonNegativeNumber = z.number().nonnegative().finite();

const dateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date',
});

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const paymentSchema = z.object({
  obligationId: z.string().min(1, 'Obligation ID is required'),
  amount: positiveNumber,
  expectedAmount: positiveNumber.optional(),
  adjustmentReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paidAt: dateString,
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: positiveNumber,
  category: categoryEnum,
  date: dateString,
  personId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const expenseUpdateSchema = expenseSchema.partial();

// ---------------------------------------------------------------------------
// Incomes
// ---------------------------------------------------------------------------
export const incomeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: positiveNumber,
  source: incomeSourceEnum,
  date: dateString,
  isRecurring: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});
export const incomeUpdateSchema = incomeSchema.partial();

// ---------------------------------------------------------------------------
// Obligations
// ---------------------------------------------------------------------------
export const obligationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  category: categoryEnum,
  amount: positiveNumber,
  totalBalance: nonNegativeNumber.optional().nullable(),
  interestRate: nonNegativeNumber.optional().nullable(),
  debitOrderDate: z.number().int().min(1).max(31, 'Debit order date must be between 1 and 31'),
  isUncompromised: z.boolean().optional(),
  isActive: z.boolean().optional(),
  personId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const obligationUpdateSchema = obligationSchema.partial();

// ---------------------------------------------------------------------------
// Savings goals
// ---------------------------------------------------------------------------
export const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetAmount: positiveNumber,
  currentAmount: nonNegativeNumber.optional(),
  targetDate: dateString.optional().nullable(),
  category: goalCategoryEnum.optional(),
  color: z.string().optional(),
});
export const goalUpdateSchema = goalSchema.partial().extend({
  addFunds: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Persons
// ---------------------------------------------------------------------------
export const personSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  budgetLimit: positiveNumber.optional(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const settingsSchema = z.object({
  monthlyIncome: nonNegativeNumber,
  payday: z.number().int().min(1).max(31, 'Payday must be between 1 and 31'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  monthlyBudget: nonNegativeNumber.optional().nullable(),
  notifyBudgetAlerts: z.boolean().optional(),
  notifyUpcomingBills: z.boolean().optional(),
  notifyPayday: z.boolean().optional(),
  notifyGoalProgress: z.boolean().optional(),
});
export const settingsUpdateSchema = settingsSchema.partial();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
