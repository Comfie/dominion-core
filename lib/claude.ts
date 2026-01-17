import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Receipt scanning result type
export interface ReceiptData {
  storeName: string;
  date: string;
  total: number;
  items?: { name: string; price: number }[];
  category?: string;
}

// Analytics insight type
export interface SpendingInsight {
  summary: string;
  highlights: string[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'concerning';
}

/**
 * Safely extract and parse JSON from Claude's response
 * Handles markdown code blocks and preamble text
 */
function extractJson<T>(text: string): T {
  let jsonText = text.trim();

  // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // Try to find a JSON object in the response
  const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonText = jsonObjectMatch[0];
  }

  // Parse and return
  return JSON.parse(jsonText) as T;
}

/**
 * Scan a receipt image using Claude Haiku
 * Extracts: store name, date, total amount, and category
 */
export async function scanReceipt(imageBase64: string, mimeType: string): Promise<ReceiptData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'You are a receipt scanning API. Always respond with valid JSON only, no explanatory text.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information in JSON format:
{
  "storeName": "Name of the store/merchant",
  "date": "Date in YYYY-MM-DD format",
  "total": 0.00,
  "category": "One of: GROCERIES, DINING, TRANSPORT, ENTERTAINMENT, SHOPPING, UTILITIES, OTHER"
}

Be precise with the total amount. If you can't determine a field, use null.
Respond ONLY with the JSON object, no other text.`,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Log raw response for debugging
    console.log('[scanReceipt] Raw Claude response:', textContent.text);

    // Parse the JSON response with robust extraction
    const parsed = extractJson<{
      storeName?: string;
      date?: string;
      total?: number;
      category?: string;
    }>(textContent.text);

    return {
      storeName: parsed.storeName || 'Unknown Store',
      date: parsed.date || new Date().toISOString().split('T')[0],
      total: typeof parsed.total === 'number' ? parsed.total : 0,
      category: parsed.category || 'OTHER',
    };
  } catch (error: any) {
    console.error('[scanReceipt] Error:', error.message);
    
    // Check for specific API errors
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY.');
    }
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.status === 400) {
      throw new Error('Invalid request. The image may be corrupted or unsupported.');
    }
    
    throw new Error(`Failed to scan receipt: ${error.message}`);
  }
}

/**
 * Generate spending insights using Claude Haiku
 * Analyzes spending patterns and provides recommendations
 */
export async function generateSpendingInsights(
  obligations: { name: string; amount: number; category: string; isUncompromised?: boolean }[],
  payments: { amount: number; paidAt: string; obligationName: string }[],
  monthlyIncome: number,
  expenses: { name: string; amount: number; category: string; date: string; person?: string | null }[] = [],
  incomes: { name: string; amount: number; source: string; date: string; isRecurring: boolean }[] = [],
  totalExtraIncome: number = 0,
  totalExpenses: number = 0,
  globalBudget: number | null = null,
  personBudgets: { name: string; budgetLimit: number | null; spent: number; overBudget: boolean; percentUsed: number | null }[] = []
): Promise<SpendingInsight> {
  // Calculate financial metrics
  const totalObligations = obligations.reduce((sum, o) => sum + o.amount, 0);
  const totalIncome = monthlyIncome + totalExtraIncome;
  const freeCashFlow = totalIncome - totalObligations - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((freeCashFlow / totalIncome) * 100).toFixed(1) : '0';

  // Budget status formatting
  const globalBudgetStatus = globalBudget
    ? `R ${totalExpenses.toLocaleString()} of R ${globalBudget.toLocaleString()} (${Math.round((totalExpenses / globalBudget) * 100)}%${totalExpenses > globalBudget ? ' - OVER BUDGET!' : ''})`
    : 'Not set';

  const personBudgetInfo =
    personBudgets.length > 0
      ? personBudgets
          .map(p =>
            p.budgetLimit
              ? `- ${p.name}: R ${p.spent.toLocaleString()} of R ${p.budgetLimit.toLocaleString()} (${p.percentUsed}%${p.overBudget ? ' - OVER BUDGET!' : ''})`
              : `- ${p.name}: R ${p.spent.toLocaleString()} spent (no budget set)`
          )
          .join('\n')
      : 'No family members tracked';

  const prompt = `You are a personal finance advisor for a South African family. Analyze this financial data and provide insights.

FINANCIAL PROFILE:
- Monthly Salary: R ${monthlyIncome.toLocaleString()}
- Extra Income This Month: R ${totalExtraIncome.toLocaleString()}
- Total Income: R ${totalIncome.toLocaleString()}
- Fixed Obligations: R ${totalObligations.toLocaleString()}
- Variable Expenses: R ${totalExpenses.toLocaleString()}
- Free Cash Flow: R ${freeCashFlow.toLocaleString()}
- Savings Rate: ${savingsRate}%

BUDGET STATUS:
- Global Monthly Budget: ${globalBudgetStatus}

FAMILY MEMBER BUDGETS:
${personBudgetInfo}

OBLIGATIONS:
${obligations.map(o => `- ${o.name} (${o.category}${o.isUncompromised ? ', Essential' : ''}): R ${o.amount.toLocaleString()}`).join('\n') || 'No obligations set up'}

RECENT EXPENSES (This Month):
${
  expenses.length > 0
    ? expenses
        .slice(0, 15)
        .map(e => `- ${e.name} (${e.category}${e.person ? `, for ${e.person}` : ''}): R ${e.amount.toLocaleString()}`)
        .join('\n')
    : 'No expenses recorded'
}

EXTRA INCOME (This Month):
${
  incomes.length > 0
    ? incomes
        .map(i => `- ${i.name} (${i.source}${i.isRecurring ? ', Recurring' : ''}): R ${i.amount.toLocaleString()}`)
        .join('\n')
    : 'No extra income recorded'
}

IMPORTANT CONTEXT:
${globalBudget && totalExpenses > globalBudget ? '⚠️ The family is OVER their global budget! Focus on cost-cutting advice.' : ''}
${personBudgets.some(p => p.overBudget) ? '⚠️ Some family members are over their individual budgets! Address this specifically.' : ''}
${freeCashFlow < 0 ? '🚨 NEGATIVE free cash flow! This is urgent - provide debt avoidance strategies.' : ''}
${expenses.some(e => e.category === 'SHOPPING' && e.amount > 1000) ? '💡 Large shopping purchases detected - advise on necessity vs wants.' : ''}

Respond with a JSON object in this exact format:
{
  "summary": "A brief 1-2 sentence overview focusing on budget status and any concerns",
  "highlights": ["observation 1", "observation 2", "observation 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "trend": "improving"
}

The "trend" field must be exactly one of: "improving", "stable", or "concerning".

Be encouraging but HONEST. If someone is over budget, say so clearly. Focus on practical advice for South African families.`;

  try {
    console.log('[generateSpendingInsights] Calling Claude API...');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'You are a JSON-only financial analysis API. Always respond with valid JSON only, no markdown formatting, no explanatory text before or after the JSON.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Log raw response for debugging
    console.log('[generateSpendingInsights] Raw Claude response:', textContent.text);

    // Parse with robust JSON extraction
    const parsed = extractJson<{
      summary?: string;
      highlights?: string[];
      recommendations?: string[];
      trend?: string;
    }>(textContent.text);

    // Validate and return with defaults
    const validTrends = ['improving', 'stable', 'concerning'] as const;
    const trend = validTrends.includes(parsed.trend as any) 
      ? (parsed.trend as 'improving' | 'stable' | 'concerning')
      : 'stable';

    return {
      summary: parsed.summary || 'Unable to generate summary',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      trend,
    };
  } catch (error: any) {
    console.error('[generateSpendingInsights] Error:', error.message);
    console.error('[generateSpendingInsights] Error stack:', error.stack);

    // Check for specific API errors
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY.');
    }
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (error.status === 400) {
      throw new Error('Invalid request format.');
    }
    if (error.status === 500 || error.status === 529) {
      throw new Error('Anthropic API is temporarily unavailable. Please try again.');
    }

    // For JSON parsing errors, provide a meaningful fallback
    if (error instanceof SyntaxError) {
      console.error('[generateSpendingInsights] JSON parsing failed, returning fallback response');
      
      // Generate a basic response based on the data we have
      const isOverBudget = globalBudget ? totalExpenses > globalBudget : false;
      const hasNegativeCashFlow = freeCashFlow < 0;

      return {
        summary: hasNegativeCashFlow
          ? 'Your expenses exceed your income this month. Immediate action recommended.'
          : isOverBudget
          ? 'You have exceeded your monthly budget. Consider reducing discretionary spending.'
          : 'Your finances appear to be on track this month.',
        highlights: [
          `Total income: R ${totalIncome.toLocaleString()}`,
          `Total obligations: R ${totalObligations.toLocaleString()}`,
          `Free cash flow: R ${freeCashFlow.toLocaleString()}`,
        ],
        recommendations: hasNegativeCashFlow || isOverBudget
          ? [
              'Review non-essential expenses',
              'Consider postponing large purchases',
              'Look for ways to increase income',
            ]
          : [
              'Continue tracking expenses',
              'Consider building an emergency fund',
              'Review subscriptions regularly',
            ],
        trend: hasNegativeCashFlow ? 'concerning' : isOverBudget ? 'concerning' : 'stable',
      };
    }

    // Re-throw other errors
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}

/**
 * Test function to verify Claude API connectivity
 */
export async function testClaudeConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Respond with exactly: {"status": "ok"}',
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log('[testClaudeConnection] Response:', textContent.text);
      return { success: true, message: 'Claude API connection successful' };
    }

    return { success: false, message: 'No response from Claude API' };
  } catch (error: any) {
    console.error('[testClaudeConnection] Error:', error);
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}