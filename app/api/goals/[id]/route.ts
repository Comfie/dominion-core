import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/goals/[id] - Get a single goal
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update a goal (including adding funds)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, targetAmount, currentAmount, targetDate, category, color, addFunds } = body;

    // First verify ownership
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Handle adding funds as a special case
    const updateData: any = {};
    
    if (addFunds !== undefined) {
      const newAmount = Number(existingGoal.currentAmount) + Number(addFunds);
      updateData.currentAmount = newAmount;
      updateData.isCompleted = newAmount >= Number(existingGoal.targetAmount);
    } else {
      if (name !== undefined) updateData.name = name;
      if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
      if (currentAmount !== undefined) {
        updateData.currentAmount = currentAmount;
        updateData.isCompleted = currentAmount >= (targetAmount || Number(existingGoal.targetAmount));
      }
      if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null;
      if (category !== undefined) updateData.category = category;
      if (color !== undefined) updateData.color = color;
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify ownership
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.savingsGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
