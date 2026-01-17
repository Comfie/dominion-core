import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface KeywordSettings {
  added: Record<string, string[]>;
  removed: Record<string, string[]>;
}

// GET /api/settings/category-keywords - Get user's custom category keywords
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
      select: { categoryKeywords: true },
    });

    const data = settings?.categoryKeywords as KeywordSettings | null;

    return NextResponse.json({
      added: data?.added || {},
      removed: data?.removed || {},
    });
  } catch (error) {
    console.error('Error fetching category keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category keywords' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/category-keywords - Update custom category keywords
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { added, removed } = body as KeywordSettings;

    // Clean up empty arrays
    const cleanedAdded: Record<string, string[]> = {};
    const cleanedRemoved: Record<string, string[]> = {};

    if (added) {
      Object.entries(added).forEach(([cat, keywords]) => {
        if (keywords && keywords.length > 0) {
          cleanedAdded[cat] = keywords;
        }
      });
    }

    if (removed) {
      Object.entries(removed).forEach(([cat, keywords]) => {
        if (keywords && keywords.length > 0) {
          cleanedRemoved[cat] = keywords;
        }
      });
    }

    // Ensure settings exist
    await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        categoryKeywords: {
          added: cleanedAdded,
          removed: cleanedRemoved,
        },
      },
      create: {
        userId: session.user.id,
        categoryKeywords: {
          added: cleanedAdded,
          removed: cleanedRemoved,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category keywords:', error);
    return NextResponse.json(
      { error: 'Failed to update category keywords' },
      { status: 500 }
    );
  }
}
