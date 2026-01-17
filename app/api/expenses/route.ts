import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/expenses - Get all expenses for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const whereClause: any = { userId: session.user.id };
    
    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: { person: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, amount, category, date, personId, notes } = body;

    if (!name || !amount || !category || !date) {
      return NextResponse.json(
        { error: 'Name, amount, category, and date are required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        name,
        amount,
        category,
        date: new Date(date),
        personId: personId || null,
        notes: notes || null,
      },
      include: { person: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
