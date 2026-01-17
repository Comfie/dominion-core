import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/notifications/preferences - Get notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
      select: {
        notifyBudgetAlerts: true,
        notifyUpcomingBills: true,
        notifyPayday: true,
        notifyGoalProgress: true,
        pushSubscription: true,
      },
    });

    return NextResponse.json({
      notifyBudgetAlerts: settings?.notifyBudgetAlerts ?? true,
      notifyUpcomingBills: settings?.notifyUpcomingBills ?? true,
      notifyPayday: settings?.notifyPayday ?? true,
      notifyGoalProgress: settings?.notifyGoalProgress ?? true,
      hasSubscription: !!settings?.pushSubscription,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notifyBudgetAlerts, notifyUpcomingBills, notifyPayday, notifyGoalProgress } = body;

    await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(notifyBudgetAlerts !== undefined && { notifyBudgetAlerts }),
        ...(notifyUpcomingBills !== undefined && { notifyUpcomingBills }),
        ...(notifyPayday !== undefined && { notifyPayday }),
        ...(notifyGoalProgress !== undefined && { notifyGoalProgress }),
      },
      create: {
        userId: session.user.id,
        notifyBudgetAlerts: notifyBudgetAlerts ?? true,
        notifyUpcomingBills: notifyUpcomingBills ?? true,
        notifyPayday: notifyPayday ?? true,
        notifyGoalProgress: notifyGoalProgress ?? true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
