import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/account/reset - Reset all financial data
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'Please type RESET to confirm' },
        { status: 400 }
      );
    }

    // Delete all user's financial data
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { userId: session.user.id } }),
      prisma.expense.deleteMany({ where: { userId: session.user.id } }),
      prisma.income.deleteMany({ where: { userId: session.user.id } }),
      prisma.receipt.deleteMany({ where: { userId: session.user.id } }),
      prisma.obligation.deleteMany({ where: { userId: session.user.id } }),
      prisma.person.deleteMany({ where: { userId: session.user.id } }),
      prisma.monthlySnapshot.deleteMany({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ success: true, message: 'All financial data has been reset' });
  } catch (error) {
    console.error('Error resetting account:', error);
    return NextResponse.json({ error: 'Failed to reset account' }, { status: 500 });
  }
}
