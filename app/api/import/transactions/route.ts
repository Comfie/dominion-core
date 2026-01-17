import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface ImportTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

// Valid categories from Prisma schema
const VALID_CATEGORIES = [
  'HOUSING', 'DEBT', 'LIVING', 'SAVINGS', 'INSURANCE',
  'UTILITIES', 'TRANSPORT', 'GROCERIES', 'OTHER',
  'DINING', 'ENTERTAINMENT', 'SHOPPING'
];

function sanitizeCategory(category: string): string {
  if (VALID_CATEGORIES.includes(category)) {
    return category;
  }
  return 'OTHER';
}

function sanitizeError(description: string, errorMessage: string): string {
  // Extract just the relevant part of the error
  if (errorMessage.includes('Invalid value for argument')) {
    return `${description}: Invalid category`;
  }
  if (errorMessage.includes('duplicate')) {
    return `${description}: Already exists`;
  }
  // Keep error short
  return `${description}: ${errorMessage.substring(0, 50)}`;
}

// POST /api/import/transactions - Bulk import transactions as expenses
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactions, importAsExpenses = true } = body as {
      transactions: ImportTransaction[];
      importAsExpenses?: boolean;
    };

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    if (importAsExpenses) {
      // Import debits as expenses
      const expenseTransactions = transactions.filter(t => t.type === 'debit');

      for (const transaction of expenseTransactions) {
        try {
          // Check for duplicates (same date, amount, and description)
          const existingExpense = await prisma.expense.findFirst({
            where: {
              userId: session.user.id,
              date: new Date(transaction.date),
              amount: transaction.amount,
              name: transaction.description,
            },
          });

          if (existingExpense) {
            skippedCount++;
            continue;
          }

          // Sanitize category to ensure it's valid
          const validCategory = sanitizeCategory(transaction.category || 'OTHER');

          await prisma.expense.create({
            data: {
              userId: session.user.id,
              name: transaction.description,
              amount: transaction.amount,
              date: new Date(transaction.date),
              category: validCategory as any,
            },
          });

          importedCount++;
        } catch (err: any) {
          errors.push(sanitizeError(transaction.description, err.message));
        }
      }
    } else {
      // Import credits as income
      const incomeTransactions = transactions.filter(t => t.type === 'credit');

      for (const transaction of incomeTransactions) {
        try {
          // Check for duplicates
          const existingIncome = await prisma.income.findFirst({
            where: {
              userId: session.user.id,
              date: new Date(transaction.date),
              amount: transaction.amount,
              name: transaction.description,
            },
          });

          if (existingIncome) {
            skippedCount++;
            continue;
          }

          await prisma.income.create({
            data: {
              userId: session.user.id,
              name: transaction.description,
              amount: transaction.amount,
              date: new Date(transaction.date),
              source: 'OTHER' as any, // Income source enum is different from expense category
            },
          });

          importedCount++;
        } catch (err: any) {
          errors.push(sanitizeError(transaction.description, err.message));
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.slice(0, 10), // Only return first 10 errors
      total: transactions.length,
    });
  } catch (error) {
    console.error('Error importing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 }
    );
  }
}
