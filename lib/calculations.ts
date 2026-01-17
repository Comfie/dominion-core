import { Obligation, Payment, DiscountStatus, UpcomingPayment } from '@/types/finance';
import { 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  differenceInDays, 
  setDate, 
  isBefore, 
  isAfter,
  format 
} from 'date-fns';

/**
 * Calculate total burn rate (uncompromised costs)
 */
export function calculateBurnRate(obligations: Obligation[]): number {
  return obligations
    .filter(o => o.isUncompromised && o.isActive)
    .reduce((sum, o) => sum + o.amount, 0);
}

/**
 * Calculate total variable costs
 */
export function calculateVariableCosts(obligations: Obligation[]): number {
  return obligations
    .filter(o => !o.isUncompromised && o.isActive)
    .reduce((sum, o) => sum + o.amount, 0);
}

/**
 * Calculate total debt outstanding
 */
export function calculateTotalDebt(obligations: Obligation[]): number {
  return obligations
    .filter(o => o.totalBalance !== undefined && o.isActive)
    .reduce((sum, o) => sum + (o.totalBalance || 0), 0);
}

/**
 * Calculate free cash flow
 */
export function calculateFreeCashFlow(
  monthlyIncome: number,
  obligations: Obligation[]
): number {
  const totalObligations = obligations
    .filter(o => o.isActive)
    .reduce((sum, o) => sum + o.amount, 0);
  return monthlyIncome - totalObligations;
}

/**
 * Check discount status for levy payments
 * Discount is secured if payment is made before the 1st of the month
 */
export function getDiscountStatus(
  levyObligation: Obligation | undefined,
  payments: Payment[],
  currentDate: Date = new Date()
): DiscountStatus {
  const defaultStatus: DiscountStatus = {
    isSecured: false,
    levyAmount: 0,
    dueDate: new Date(),
    daysRemaining: 0,
  };

  if (!levyObligation) return defaultStatus;

  const currentMonth = format(currentDate, 'yyyy-MM');
  const nextMonth = format(addMonths(currentDate, 1), 'yyyy-MM');
  const endOfCurrentMonth = endOfMonth(currentDate);
  const daysRemaining = differenceInDays(endOfCurrentMonth, currentDate);

  // Check if payment for current month exists
  const currentPayment = payments.find(p => p.month === currentMonth);
  
  if (currentPayment) {
    return {
      isSecured: true,
      levyAmount: levyObligation.amount,
      paidDate: currentPayment.paidAt,
      dueDate: endOfCurrentMonth,
      daysRemaining: 0,
    };
  }

  return {
    isSecured: false,
    levyAmount: levyObligation.amount,
    dueDate: endOfCurrentMonth,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

/**
 * Get upcoming payments for the current pay cycle
 */
export function getUpcomingPayments(
  obligations: Obligation[],
  payments: Payment[],
  payday: number,
  currentDate: Date = new Date()
): UpcomingPayment[] {
  const currentMonth = format(currentDate, 'yyyy-MM');
  const currentDay = currentDate.getDate();

  return obligations
    .filter(o => o.isActive)
    .map(obligation => {
      let dueDate: Date;
      
      // Determine if this payment is before or after the current day
      if (obligation.debitOrderDate >= currentDay) {
        dueDate = setDate(currentDate, obligation.debitOrderDate);
      } else {
        dueDate = setDate(addMonths(currentDate, 1), obligation.debitOrderDate);
      }

      const isPaid = payments.some(
        p => p.obligationId === obligation.id && p.month === currentMonth
      );

      return {
        obligation,
        dueDate,
        daysUntil: differenceInDays(dueDate, currentDate),
        isPaid,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate debt payoff priority (highest interest first)
 */
export function getDebtPriority(obligations: Obligation[]): Obligation[] {
  return obligations
    .filter(o => o.totalBalance && o.totalBalance > 0 && o.isActive)
    .sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
}

/**
 * Calculate months to pay off debt at current rate
 */
export function calculatePayoffMonths(
  balance: number,
  monthlyPayment: number,
  annualRate: number
): number {
  if (monthlyPayment <= 0 || balance <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  
  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }
  
  // Using the formula: n = -log(1 - r*P/M) / log(1 + r)
  const n = -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate);
  
  return Math.ceil(n);
}
