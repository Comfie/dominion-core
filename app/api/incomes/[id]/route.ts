import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/incomes/[id] - Get a single income
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const income = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}

// PATCH /api/incomes/[id] - Update an income
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const income = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, amount, source, date, isRecurring, notes } = body;

    const updated = await prisma.income.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(amount !== undefined && { amount }),
        ...(source && { source }),
        ...(date && { date: new Date(date) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating income:', error);
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 });
  }
}

// DELETE /api/incomes/[id] - Delete an income
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const income = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    await prisma.income.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting income:', error);
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 });
  }
}
