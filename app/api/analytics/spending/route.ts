import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, subMonths, startOfMonth, endOfMonth, parse } from 'date-fns';

// GET /api/analytics/spending - Get spending analytics for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6', 10);
    const targetMonthParam = searchParams.get('targetMonth');

    // Use targetMonth if provided, otherwise use current date
    let targetDate = new Date();
    if (targetMonthParam) {
      targetDate = parse(targetMonthParam, 'yyyy-MM', new Date());
    }

    // Get expenses for the last N months from the target date
    const startDate = startOfMonth(subMonths(targetDate, months - 1));
    const endDate = endOfMonth(targetDate);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Target month data (the month being viewed)
    const currentMonthStart = startOfMonth(targetDate);
    const currentMonthEnd = endOfMonth(targetDate);
    const currentMonthExpenses = expenses.filter(
      e => new Date(e.date) >= currentMonthStart && new Date(e.date) <= currentMonthEnd
    );

    // Previous month data for comparison
    const prevMonthStart = startOfMonth(subMonths(targetDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(targetDate, 1));
    const prevMonthExpenses = expenses.filter(
      e => new Date(e.date) >= prevMonthStart && new Date(e.date) <= prevMonthEnd
    );

    // Calculate category breakdown for current month
    const categoryBreakdown: Record<string, number> = {};
    currentMonthExpenses.forEach(expense => {
      const category = expense.category;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(expense.amount);
    });

    // Calculate category breakdown for previous month
    const prevCategoryBreakdown: Record<string, number> = {};
    prevMonthExpenses.forEach(expense => {
      const category = expense.category;
      prevCategoryBreakdown[category] = (prevCategoryBreakdown[category] || 0) + Number(expense.amount);
    });

    // Calculate month-over-month data
    const monthlyData: Array<{
      month: string;
      total: number;
      categoryBreakdown: Record<string, number>;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(targetDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'MMM yyyy');

      const monthExpenses = expenses.filter(
        e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
      );

      const breakdown: Record<string, number> = {};
      let total = 0;
      monthExpenses.forEach(expense => {
        const amount = Number(expense.amount);
        breakdown[expense.category] = (breakdown[expense.category] || 0) + amount;
        total += amount;
      });

      monthlyData.push({
        month: monthKey,
        total,
        categoryBreakdown: breakdown,
      });
    }

    // Calculate totals
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthOverMonthChange = prevMonthTotal > 0 
      ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
      : 0;

    // Generate insights
    const insights: Array<{
      type: 'increase' | 'decrease' | 'info' | 'warning';
      message: string;
      category?: string;
      change?: number;
    }> = [];

    // Find biggest spending category
    const sortedCategories = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a);
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const percentage = currentMonthTotal > 0 ? (topAmount / currentMonthTotal) * 100 : 0;
      insights.push({
        type: 'info',
        message: `${topCategory.charAt(0) + topCategory.slice(1).toLowerCase()} is your biggest expense (${percentage.toFixed(0)}% of spending)`,
        category: topCategory,
      });
    }

    // Compare categories month-over-month
    Object.entries(categoryBreakdown).forEach(([category, amount]) => {
      const prevAmount = prevCategoryBreakdown[category] || 0;
      if (prevAmount > 0) {
        const change = ((amount - prevAmount) / prevAmount) * 100;
        if (change > 20) {
          insights.push({
            type: 'increase',
            message: `You spent ${change.toFixed(0)}% more on ${category.charAt(0) + category.slice(1).toLowerCase()} this month`,
            category,
            change,
          });
        } else if (change < -20) {
          insights.push({
            type: 'decrease',
            message: `You saved ${Math.abs(change).toFixed(0)}% on ${category.charAt(0) + category.slice(1).toLowerCase()} this month`,
            category,
            change,
          });
        }
      }
    });

    // Average daily spending
    // For current month, use days elapsed; for historic months, use total days in month
    const now = new Date();
    const isCurrentMonth = targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear();
    const daysInMonth = isCurrentMonth
      ? now.getDate()
      : new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const avgDailySpending = daysInMonth > 0 ? currentMonthTotal / daysInMonth : 0;

    return NextResponse.json({
      currentMonth: {
        total: currentMonthTotal,
        categoryBreakdown,
        transactionCount: currentMonthExpenses.length,
      },
      previousMonth: {
        total: prevMonthTotal,
        categoryBreakdown: prevCategoryBreakdown,
        transactionCount: prevMonthExpenses.length,
      },
      monthOverMonthChange,
      monthlyData,
      insights: insights.slice(0, 5), // Limit to 5 insights
      avgDailySpending,
      topCategories: sortedCategories.slice(0, 5).map(([category, amount]) => ({
        category,
        amount,
        percentage: currentMonthTotal > 0 ? (amount / currentMonthTotal) * 100 : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching spending analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending analytics' },
      { status: 500 }
    );
  }
}
