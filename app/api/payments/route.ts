import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/payments - Get all payments for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Optional filter by month (e.g., "2026-01")

    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...(month && { month }),
      },
      include: {
        obligation: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Record a new payment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { obligationId, amount, expectedAmount, adjustmentReason, paidAt, month, notes } = body;

    // Validation
    if (!obligationId || !amount || !paidAt || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify obligation ownership
    const obligation = await prisma.obligation.findFirst({
      where: {
        id: obligationId,
        userId: session.user.id,
      },
    });

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        obligationId,
        amount,
        expectedAmount: expectedAmount || null,
        adjustmentReason: adjustmentReason || null,
        paidAt: new Date(paidAt),
        month,
        notes: notes || null,
      },
      include: {
        obligation: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
