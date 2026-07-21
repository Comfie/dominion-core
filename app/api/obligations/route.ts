import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { obligationSchema } from '@/lib/validations';

// GET /api/obligations - Get all obligations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const obligations = await prisma.obligation.findMany({
      where: { userId: session.user.id },
      orderBy: { debitOrderDate: 'asc' },
    });

    return NextResponse.json(obligations);
  } catch (error) {
    console.error('Error fetching obligations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch obligations' },
      { status: 500 }
    );
  }
}

// POST /api/obligations - Create a new obligation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = obligationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      provider,
      category,
      amount,
      totalBalance,
      interestRate,
      debitOrderDate,
      isUncompromised,
      isActive,
      personId,
      notes,
    } = result.data;

    const obligation = await prisma.obligation.create({
      data: {
        userId: session.user.id,
        name,
        provider,
        category,
        amount,
        totalBalance: totalBalance ?? null,
        interestRate: interestRate ?? null,
        debitOrderDate,
        isUncompromised: isUncompromised ?? true,
        isActive: isActive ?? true,
        personId: personId ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(obligation, { status: 201 });
  } catch (error) {
    console.error('Error creating obligation:', error);
    return NextResponse.json(
      { error: 'Failed to create obligation' },
      { status: 500 }
    );
  }
}
