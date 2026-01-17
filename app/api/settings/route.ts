import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          monthlyIncome: 0,
          payday: 25,
          currency: 'ZAR',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { monthlyIncome, monthlyBudget, payday, currency } = body;

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        monthlyIncome: monthlyIncome !== undefined ? monthlyIncome : undefined,
        monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : undefined,
        payday: payday !== undefined ? payday : undefined,
        currency: currency !== undefined ? currency : undefined,
      },
      create: {
        userId: session.user.id,
        monthlyIncome: monthlyIncome || 0,
        monthlyBudget: monthlyBudget || null,
        payday: payday || 25,
        currency: currency || 'ZAR',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
