import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

interface MatchedObligation {
  transactionIndex: number;
  obligationId: string;
  obligationName: string;
  provider: string;
  expectedAmount: number;
  actualAmount: number;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

// POST /api/import/match-obligations - Match transactions to obligations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactions } = body as { transactions: Transaction[] };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    // Get all active obligations for the user
    const obligations = await prisma.obligation.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    // Get existing payments to avoid duplicates
    const months = [...new Set(transactions.map(t => format(new Date(t.date), 'yyyy-MM')))];
    const existingPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        month: { in: months },
      },
      include: { obligation: true },
    });

    const matches: MatchedObligation[] = [];

    // Only consider debit transactions
    const debits = transactions
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter(t => t.type === 'debit');

    for (const tx of debits) {
      const lowerDesc = tx.description.toLowerCase();
      const txMonth = format(new Date(tx.date), 'yyyy-MM');

      for (const obligation of obligations) {
        // Check if already paid for this month
        const alreadyPaid = existingPayments.some(
          p => p.obligationId === obligation.id && p.month === txMonth
        );
        if (alreadyPaid) continue;

        // Check if already matched
        const alreadyMatched = matches.some(
          m => m.obligationId === obligation.id &&
               format(new Date(transactions[m.transactionIndex].date), 'yyyy-MM') === txMonth
        );
        if (alreadyMatched) continue;

        let confidence: 'high' | 'medium' | 'low' | null = null;
        let matchReason = '';

        const providerLower = obligation.provider.toLowerCase();
        const nameLower = obligation.name.toLowerCase();
        const expectedAmount = Number(obligation.amount);
        const amountDiff = Math.abs(tx.amount - expectedAmount);
        const amountTolerance = expectedAmount * 0.05; // 5% tolerance

        // High confidence: Provider name in description AND amount matches closely
        if (lowerDesc.includes(providerLower) && amountDiff <= amountTolerance) {
          confidence = 'high';
          matchReason = `Provider "${obligation.provider}" found in description with matching amount`;
        }
        // High confidence: Exact amount match with provider
        else if (lowerDesc.includes(providerLower)) {
          confidence = 'medium';
          matchReason = `Provider "${obligation.provider}" found in description`;
        }
        // Medium confidence: Obligation name in description
        else if (lowerDesc.includes(nameLower) && nameLower.length > 3) {
          confidence = amountDiff <= amountTolerance ? 'high' : 'medium';
          matchReason = `Obligation name "${obligation.name}" found in description`;
        }
        // Medium confidence: Exact amount match (within tolerance)
        else if (amountDiff <= 0.01) {
          confidence = 'low';
          matchReason = `Exact amount match (R${expectedAmount})`;
        }

        if (confidence) {
          matches.push({
            transactionIndex: tx.originalIndex,
            obligationId: obligation.id,
            obligationName: obligation.name,
            provider: obligation.provider,
            expectedAmount,
            actualAmount: tx.amount,
            confidence,
            matchReason,
          });
        }
      }
    }

    // Sort by confidence (high first)
    matches.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    });

    return NextResponse.json({
      matches,
      totalObligations: obligations.length,
      totalTransactions: debits.length,
    });
  } catch (error) {
    console.error('Error matching obligations:', error);
    return NextResponse.json(
      { error: 'Failed to match obligations' },
      { status: 500 }
    );
  }
}

// Record matched payments
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matches } = body as {
      matches: Array<{
        obligationId: string;
        amount: number;
        date: string;
      }>;
    };

    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: 'No matches provided' },
        { status: 400 }
      );
    }

    let recordedCount = 0;
    const errors: string[] = [];

    for (const match of matches) {
      try {
        const month = format(new Date(match.date), 'yyyy-MM');

        // Verify obligation ownership
        const obligation = await prisma.obligation.findFirst({
          where: {
            id: match.obligationId,
            userId: session.user.id,
          },
        });

        if (!obligation) {
          errors.push(`Obligation not found: ${match.obligationId}`);
          continue;
        }

        // Check for existing payment
        const existing = await prisma.payment.findFirst({
          where: {
            obligationId: match.obligationId,
            month,
          },
        });

        if (existing) {
          continue; // Skip duplicate
        }

        const expectedAmount = Number(obligation.amount);
        const actualAmount = match.amount;
        const isDifferent = Math.abs(actualAmount - expectedAmount) > 0.01;

        await prisma.payment.create({
          data: {
            userId: session.user.id,
            obligationId: match.obligationId,
            amount: actualAmount,
            expectedAmount: isDifferent ? expectedAmount : null,
            adjustmentReason: isDifferent ?
              (actualAmount < expectedAmount ? 'DECREASE' : 'INCREASE') : null,
            paidAt: new Date(match.date),
            month,
            notes: 'Auto-matched from bank statement import',
          },
        });

        recordedCount++;
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    return NextResponse.json({
      success: true,
      recorded: recordedCount,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('Error recording payments:', error);
    return NextResponse.json(
      { error: 'Failed to record payments' },
      { status: 500 }
    );
  }
}
