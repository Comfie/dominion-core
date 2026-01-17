import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/goals - Get all savings goals for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isCompleted: 'asc' },
        { targetDate: 'asc' },
      ],
    });

    // Convert Decimal to number for JSON serialization
    const formattedGoals = goals.map(goal => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    }));

    return NextResponse.json(formattedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new savings goal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, targetAmount, currentAmount, targetDate, category, color } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: 'Name and target amount are required' },
        { status: 400 }
      );
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: session.user.id,
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || 'OTHER',
        color: color || '#8B5CF6',
      },
    });

    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
