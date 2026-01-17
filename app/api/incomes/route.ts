import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/incomes - Get all incomes for the current user
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

    const incomes = await prisma.income.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incomes' },
      { status: 500 }
    );
  }
}

// POST /api/incomes - Create a new income
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, amount, source, date, isRecurring, notes } = body;

    if (!name || !amount || !source || !date) {
      return NextResponse.json(
        { error: 'Name, amount, source, and date are required' },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        userId: session.user.id,
        name,
        amount,
        source,
        date: new Date(date),
        isRecurring: isRecurring || false,
        notes: notes || null,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json(
      { error: 'Failed to create income' },
      { status: 500 }
    );
  }
}
