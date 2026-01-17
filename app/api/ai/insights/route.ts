import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSpendingInsights } from '@/lib/claude';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

// GET /api/ai/insights - Get AI-generated spending insights
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMonth = format(new Date(), 'yyyy-MM');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch user's data including expenses and income
    const [obligations, payments, settings, expenses, incomes, persons] = await Promise.all([
      prisma.obligation.findMany({
        where: { userId: session.user.id },
        select: { name: true, amount: true, category: true, isUncompromised: true },
      }),
      prisma.payment.findMany({
        where: {
          userId: session.user.id,
          paidAt: { gte: thirtyDaysAgo },
        },
        include: { obligation: { select: { name: true } } },
        orderBy: { paidAt: 'desc' },
      }),
      prisma.settings.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: thirtyDaysAgo },
        },
        include: { person: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: { gte: thirtyDaysAgo },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.person.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, budgetLimit: true },
      }),
    ]);

    // Format data for the AI
    const formattedObligations = obligations.map(o => ({
      name: o.name,
      amount: Number(o.amount),
      category: o.category,
      isUncompromised: o.isUncompromised,
    }));

    const formattedPayments = payments.map(p => ({
      amount: Number(p.amount),
      paidAt: p.paidAt.toISOString(),
      obligationName: p.obligation.name,
    }));

    const formattedExpenses = expenses.map(e => ({
      name: e.name,
      amount: Number(e.amount),
      category: e.category,
      date: e.date.toISOString(),
      person: e.person?.name || null,
    }));

    const formattedIncomes = incomes.map(i => ({
      name: i.name,
      amount: Number(i.amount),
      source: i.source,
      date: i.date.toISOString(),
      isRecurring: i.isRecurring,
    }));

    const monthlyIncome = settings?.monthlyIncome ? Number(settings.monthlyIncome) : 0;
    const globalBudget = settings?.monthlyBudget ? Number(settings.monthlyBudget) : null;
    const totalExtraIncome = formattedIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = formattedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate per-person spending vs budget
    const personBudgets = persons.map(p => {
      const personExpenses = expenses
        .filter(e => e.person?.id === p.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        name: p.name,
        budgetLimit: p.budgetLimit ? Number(p.budgetLimit) : null,
        spent: personExpenses,
        overBudget: p.budgetLimit ? personExpenses > Number(p.budgetLimit) : false,
        percentUsed: p.budgetLimit ? Math.round((personExpenses / Number(p.budgetLimit)) * 100) : null,
      };
    });

    // If no data, return a default insight
    if (obligations.length === 0 && monthlyIncome === 0 && expenses.length === 0) {
      return NextResponse.json({
        summary: 'Welcome! Add your income and obligations to get personalized insights.',
        highlights: ['Set up your monthly income in Settings', 'Add your regular obligations'],
        recommendations: ['Start by tracking your essential expenses', 'Set realistic financial goals'],
        trend: 'stable',
      });
    }

    // Generate insights with Claude - pass all financial data including budgets
    const insights = await generateSpendingInsights(
      formattedObligations,
      formattedPayments,
      monthlyIncome,
      formattedExpenses,
      formattedIncomes,
      totalExtraIncome,
      totalExpenses,
      globalBudget,
      personBudgets
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    // Log the actual error for debugging
    console.error('Error generating insights:', error?.message || error);
    
    // Return a helpful fallback response instead of error
    return NextResponse.json({
      summary: 'Your finances are being tracked. Add more data for personalized insights.',
      highlights: [
        'Regular tracking helps build good financial habits',
        'Keep adding your obligations and payments',
      ],
      recommendations: [
        'Review your spending monthly',
        'Set up all your regular obligations',
      ],
      trend: 'stable',
    });
  }
}
