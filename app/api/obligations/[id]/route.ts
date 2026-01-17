import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/obligations/[id] - Get a specific obligation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const obligation = await prisma.obligation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(obligation);
  } catch (error) {
    console.error('Error fetching obligation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch obligation' },
      { status: 500 }
    );
  }
}

// PATCH /api/obligations/[id] - Update an obligation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.obligation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    const obligation = await prisma.obligation.update({
      where: { id },
      data: {
        ...body,
        userId: session.user.id, // Ensure userId doesn't change
      },
    });

    return NextResponse.json(obligation);
  } catch (error) {
    console.error('Error updating obligation:', error);
    return NextResponse.json(
      { error: 'Failed to update obligation' },
      { status: 500 }
    );
  }
}

// DELETE /api/obligations/[id] - Delete an obligation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.obligation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Obligation not found' },
        { status: 404 }
      );
    }

    await prisma.obligation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Obligation deleted successfully' });
  } catch (error) {
    console.error('Error deleting obligation:', error);
    return NextResponse.json(
      { error: 'Failed to delete obligation' },
      { status: 500 }
    );
  }
}
