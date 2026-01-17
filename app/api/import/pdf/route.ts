import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
}

const EXTRACTION_PROMPT = `You are a bank statement parser. Analyze this bank statement image and extract ALL transactions.

For each transaction, extract:
- date: The transaction date in YYYY-MM-DD format
- description: The transaction description/reference
- amount: The numeric amount (positive number only)
- type: "debit" for money going out, "credit" for money coming in

Return ONLY a valid JSON array of transactions, no other text. Example:
[
  {"date": "2024-01-15", "description": "CHECKERS WATERFALL", "amount": 523.45, "type": "debit"},
  {"date": "2024-01-14", "description": "SALARY DEPOSIT", "amount": 25000.00, "type": "credit"}
]

Important:
- Extract ALL transactions visible on the page
- Use YYYY-MM-DD date format
- Amount should be a positive number
- Determine if debit or credit based on the transaction (payments/purchases are debits, deposits/refunds are credits)
- If you can't determine the type, use "debit" for negative amounts and "credit" for positive
- Return an empty array [] if no transactions are found
`;

// POST /api/import/pdf - Extract transactions from PDF using Claude Vision
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine media type
    const mediaType = file.type === 'application/pdf' 
      ? 'application/pdf' 
      : file.type.startsWith('image/') 
        ? file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        : null;

    if (!mediaType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or image.' },
        { status: 400 }
      );
    }

    // For PDFs, we need to handle them differently
    // Claude can process PDFs directly as documents
    let transactions: ExtractedTransaction[] = [];

    if (file.type === 'application/pdf') {
      // Claude 3 can process PDFs as documents with base64
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      // Parse the response
      const textContent = response.content.find(c => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        transactions = parseClaudeResponse(textContent.text);
      }
    } else {
      // For images, use image content type
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      // Parse the response
      const textContent = response.content.find(c => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        transactions = parseClaudeResponse(textContent.text);
      }
    }

    // Auto-categorize transactions
    const categorizedTransactions = transactions.map(t => ({
      ...t,
      category: categorizeTransaction(t.description),
    }));

    return NextResponse.json({
      success: true,
      transactions: categorizedTransactions,
      count: categorizedTransactions.length,
    });
  } catch (error: any) {
    console.error('Error extracting from PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract transactions' },
      { status: 500 }
    );
  }
}

function parseClaudeResponse(text: string): ExtractedTransaction[] {
  try {
    let jsonText = text.trim();

    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Try to find a JSON array in the response
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // If no complete array found, try to extract partial and close it
      const partialMatch = jsonText.match(/\[[\s\S]*/);
      if (partialMatch) {
        // Try to repair truncated JSON by finding last complete object
        let partialJson = partialMatch[0];
        // Find the last complete object (ends with })
        const lastCompleteObject = partialJson.lastIndexOf('}');
        if (lastCompleteObject > 0) {
          partialJson = partialJson.substring(0, lastCompleteObject + 1) + ']';
          try {
            const parsed = JSON.parse(partialJson);
            if (Array.isArray(parsed)) {
              console.log(`Repaired truncated JSON, extracted ${parsed.length} transactions`);
              return filterValidTransactions(parsed);
            }
          } catch (e) {
            console.warn('Could not repair truncated JSON');
          }
        }
      }
      console.warn('No JSON array found in response:', text.substring(0, 500));
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed)) {
      return [];
    }

    return filterValidTransactions(parsed);
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return [];
  }
}

function filterValidTransactions(parsed: any[]): ExtractedTransaction[] {
  return parsed.filter((t: any) => 
    t.date && t.description && typeof t.amount === 'number'
  ).map((t: any) => ({
    date: t.date,
    description: t.description,
    amount: Math.abs(t.amount),
    type: t.type === 'credit' ? 'credit' : 'debit',
  }));
}

// Valid categories from Prisma schema
const VALID_CATEGORIES = [
  'HOUSING', 'DEBT', 'LIVING', 'SAVINGS', 'INSURANCE', 
  'UTILITIES', 'TRANSPORT', 'GROCERIES', 'OTHER', 
  'DINING', 'ENTERTAINMENT', 'SHOPPING'
];

// Category keywords for auto-categorization
// Maps keywords to valid Prisma Category enum values
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  GROCERIES: ['checkers', 'pick n pay', 'woolworths', 'spar', 'shoprite', 'food lover', 'makro', 'clicks', 'dischem'],
  TRANSPORT: ['uber', 'bolt', 'shell', 'engen', 'sasol', 'bp ', 'caltex', 'petrol', 'fuel', 'e-toll', 'cartrack'],
  UTILITIES: ['eskom', 'city of', 'municipality', 'water', 'electricity', 'telkom', 'vodacom', 'mtn', 'dstv', 'afrihost', 'cell c'],
  ENTERTAINMENT: ['netflix', 'spotify', 'apple.com', 'google', 'youtube', 'steam', 'showmax', 'claude.ai'],
  DINING: ['restaurant', 'cafe', 'coffee', 'mcdonald', 'kfc', 'nando', 'spur', 'steers', 'wimpy', 'xpresso'],
  SHOPPING: ['takealot', 'amazon', 'shein', 'zara', 'mr price', 'edgars', 'foschini', 'truworths', 'jet ', 'shoe city', 'leroy merlin'],
  INSURANCE: ['insurance', 'sanlam', 'old mutual', 'liberty', 'momentum', 'outsurance', 'miway', 'discovery'],
  LIVING: ['medical', 'pharmacy', 'doctor', 'dentist', 'hospital', 'clinic', 'medirite'],
  HOUSING: ['levies', 'rent', 'bond', 'nedbhl', 'home loan'],
  DEBT: ['loan', 'credit', 'repayment'],
};

function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Check for bank fees as OTHER (since BANKING isn't a valid category)
  const bankingKeywords = ['bank charge', 'service fee', 'monthly fee', 'atm', 'cash withdrawal', 'fee', 'facility fee', 'maintenance fee', 'payshap'];
  for (const keyword of bankingKeywords) {
    if (lowerDesc.includes(keyword)) {
      return 'OTHER';
    }
  }
  
  return 'OTHER';
}
