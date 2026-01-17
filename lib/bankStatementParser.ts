/**
 * CSV Parser for South African Bank Statements
 * Supports: FNB, Standard Bank, Nedbank, Capitec, ABSA
 */

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  reference?: string;
  category?: string;
}

export type BankFormat = 'fnb' | 'standard_bank' | 'nedbank' | 'capitec' | 'absa' | 'generic';

interface BankColumnMapping {
  date: number | string;
  description: number | string;
  amount?: number | string;
  debit?: number | string;
  credit?: number | string;
  balance?: number | string;
  reference?: number | string;
  dateFormat: string;
}

// Column mappings for each bank
const BANK_MAPPINGS: Record<BankFormat, BankColumnMapping> = {
  fnb: {
    date: 0,
    description: 2,
    debit: 3,
    credit: 4,
    balance: 5,
    dateFormat: 'dd/MM/yyyy',
  },
  standard_bank: {
    date: 0,
    description: 1,
    debit: 2,
    credit: 3,
    balance: 4,
    dateFormat: 'yyyy/MM/dd',
  },
  nedbank: {
    date: 0,
    description: 1,
    amount: 2,
    balance: 3,
    dateFormat: 'dd MMM yyyy',
  },
  capitec: {
    date: 0,
    description: 1,
    amount: 2,
    balance: 3,
    dateFormat: 'yyyy-MM-dd',
  },
  absa: {
    date: 0,
    description: 2,
    amount: 3,
    balance: 4,
    reference: 1,
    dateFormat: 'dd/MM/yyyy',
  },
  generic: {
    date: 0,
    description: 1,
    amount: 2,
    balance: 3,
    dateFormat: 'yyyy-MM-dd',
  },
};

// Valid categories from Prisma schema:
// HOUSING, DEBT, LIVING, SAVINGS, INSURANCE, UTILITIES, TRANSPORT, GROCERIES, OTHER, DINING, ENTERTAINMENT, SHOPPING

// Category keywords for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  GROCERIES: [
    'checkers', 'pick n pay', 'woolworths', 'spar', 'shoprite', 'food lover',
    'makro', 'game', 'pnp', 'clicks', 'dischem', 'dis-chem', 'massmart',
  ],
  TRANSPORT: [
    'uber', 'bolt', 'shell', 'engen', 'sasol', 'bp ', 'caltex', 'petroport',
    'petrol', 'fuel', 'e-toll', 'sanral', 'aa ', 'parking', 'cartrack', 'total ',
  ],
  UTILITIES: [
    'eskom', 'city of', 'municipality', 'water', 'electricity', 'telkom',
    'vodacom', 'mtn', 'cell c', 'rain ', 'fibre', 'dstv', 'multichoice', 'afrihost',
  ],
  ENTERTAINMENT: [
    'netflix', 'spotify', 'apple.com', 'google', 'youtube', 'steam',
    'playstation', 'xbox', 'showmax', 'ster-kinekor', 'nu metro', 'claude.ai',
  ],
  DINING: [
    'restaurant', 'cafe', 'coffee', 'mcdonald', 'kfc', 'nando', 'spur',
    'steers', 'debonairs', 'pizza', 'wimpy', 'mugg', 'vida', 'starbucks', 'xpresso', 'baglios',
  ],
  SHOPPING: [
    'takealot', 'amazon', 'shein', 'zara', 'h&m', 'mr price', 'edgars',
    'foschini', 'truworths', 'jet ', 'ackermans', 'pep ', 'bash', 'shoe city', 'leroy merlin',
  ],
  LIVING: [
    'discovery', 'medscheme', 'medical', 'pharmacy', 'doctor', 'dentist',
    'hospital', 'clinic', 'netcare', 'mediclinic', 'medirite',
  ],
  INSURANCE: [
    'insurance', 'sanlam', 'old mutual', 'liberty', 'momentum', 'outsurance',
    'santam', 'dialdirect', 'budget insurance', 'miway',
  ],
  HOUSING: [
    'levies', 'rent', 'bond', 'nedbhl', 'home loan', 'graceland',
  ],
  DEBT: [
    'loan', 'repayment',
  ],
};

/**
 * Detect the bank format from CSV content
 */
export function detectBankFormat(headers: string[], firstRow: string[]): BankFormat {
  const headerStr = headers.join(',').toLowerCase();

  // FNB: Usually has "Date", "Amount", "Balance", "Description"
  if (headerStr.includes('fnb') || (headerStr.includes('date') && headerStr.includes('amount') && headers.length >= 5)) {
    if (firstRow[0]?.includes('/') && firstRow[0]?.split('/')[0].length === 2) {
      return 'fnb';
    }
  }

  // Standard Bank: Date format is yyyy/MM/dd
  if (firstRow[0]?.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
    return 'standard_bank';
  }

  // Capitec: Date format is yyyy-MM-dd
  if (firstRow[0]?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return 'capitec';
  }

  // Nedbank: Date has month names
  if (firstRow[0]?.match(/^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/)) {
    return 'nedbank';
  }

  // ABSA: Usually has reference column
  if (headers.length >= 5 && headerStr.includes('reference')) {
    return 'absa';
  }

  return 'generic';
}

/**
 * Parse a date string based on the expected format
 */
function parseDate(dateStr: string, format: string): Date {
  const cleanDate = dateStr.trim();

  // Try ISO format first
  if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(cleanDate);
  }

  // dd/MM/yyyy
  if (cleanDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = cleanDate.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // yyyy/MM/dd
  if (cleanDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
    const [year, month, day] = cleanDate.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // dd MMM yyyy
  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const match = cleanDate.match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = monthNames[match[2].toLowerCase()];
    const year = parseInt(match[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Fallback
  return new Date(cleanDate);
}

/**
 * Parse amount from string, handling negative values and different formats
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove currency symbols, spaces, and handle negative signs
  const cleaned = amountStr
    .replace(/[R$€£\s]/g, '')
    .replace(/,/g, '')
    .replace(/\(([0-9.]+)\)/, '-$1'); // Handle (123.45) as negative
  return parseFloat(cleaned) || 0;
}

export interface KeywordSettings {
  added?: Record<string, string[]>;
  removed?: Record<string, string[]>;
}

/**
 * Auto-categorize a transaction based on description
 * @param description - Transaction description
 * @param customKeywords - Optional custom keyword settings (added and removed)
 */
export function categorizeTransaction(
  description: string,
  customKeywords?: KeywordSettings
): string {
  const lowerDesc = description.toLowerCase();

  // Build effective keywords: defaults + added - removed
  const effectiveKeywords: Record<string, string[]> = {};

  for (const [category, defaults] of Object.entries(CATEGORY_KEYWORDS)) {
    const added = customKeywords?.added?.[category] || [];
    const removed = customKeywords?.removed?.[category] || [];

    // Filter out removed keywords and add custom ones
    effectiveKeywords[category] = [
      ...defaults.filter(k => !removed.includes(k)),
      ...added,
    ];
  }

  for (const [category, keywords] of Object.entries(effectiveKeywords)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'OTHER';
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Main function to parse a bank statement CSV
 */
export function parseBankStatement(
  csvContent: string,
  bankFormat?: BankFormat,
  customKeywords?: KeywordSettings
): { transactions: ParsedTransaction[]; bankFormat: BankFormat; errors: string[] } {
  const errors: string[] = [];
  const rows = parseCSV(csvContent);

  if (rows.length < 2) {
    return { transactions: [], bankFormat: 'generic', errors: ['File is empty or has no data rows'] };
  }

  // First row is usually headers
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Detect bank format if not specified
  const detectedFormat = bankFormat || detectBankFormat(headers, dataRows[0]);
  const mapping = BANK_MAPPINGS[detectedFormat];

  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    try {
      // Skip empty rows
      if (row.every(cell => !cell.trim())) continue;

      // Get values based on mapping
      const dateIdx = typeof mapping.date === 'number' ? mapping.date : headers.indexOf(mapping.date as string);
      const descIdx = typeof mapping.description === 'number' ? mapping.description : headers.indexOf(mapping.description as string);

      const dateStr = row[dateIdx];
      const description = row[descIdx];

      if (!dateStr || !description) continue;

      // Parse amount - handle separate debit/credit columns or single amount column
      let amount: number;
      let type: 'debit' | 'credit';

      if (mapping.debit !== undefined && mapping.credit !== undefined) {
        const debitIdx = typeof mapping.debit === 'number' ? mapping.debit : headers.indexOf(mapping.debit as string);
        const creditIdx = typeof mapping.credit === 'number' ? mapping.credit : headers.indexOf(mapping.credit as string);

        const debitAmount = parseAmount(row[debitIdx]);
        const creditAmount = parseAmount(row[creditIdx]);

        if (debitAmount !== 0) {
          amount = Math.abs(debitAmount);
          type = 'debit';
        } else if (creditAmount !== 0) {
          amount = Math.abs(creditAmount);
          type = 'credit';
        } else {
          continue; // Skip rows with no amount
        }
      } else if (mapping.amount !== undefined) {
        const amountIdx = typeof mapping.amount === 'number' ? mapping.amount : headers.indexOf(mapping.amount as string);
        const rawAmount = parseAmount(row[amountIdx]);
        amount = Math.abs(rawAmount);
        type = rawAmount < 0 ? 'debit' : 'credit';
      } else {
        errors.push(`Row ${i + 2}: Could not determine amount`);
        continue;
      }

      // Parse balance if available
      let balance: number | undefined;
      if (mapping.balance !== undefined) {
        const balanceIdx = typeof mapping.balance === 'number' ? mapping.balance : headers.indexOf(mapping.balance as string);
        balance = parseAmount(row[balanceIdx]);
      }

      // Parse reference if available
      let reference: string | undefined;
      if (mapping.reference !== undefined) {
        const refIdx = typeof mapping.reference === 'number' ? mapping.reference : headers.indexOf(mapping.reference as string);
        reference = row[refIdx];
      }

      // Auto-categorize
      const category = categorizeTransaction(description, customKeywords);

      transactions.push({
        date: parseDate(dateStr, mapping.dateFormat),
        description: description.trim(),
        amount,
        type,
        balance,
        reference,
        category,
      });
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  return { transactions, bankFormat: detectedFormat, errors };
}

/**
 * Get a summary of parsed transactions
 */
export function getTransactionSummary(transactions: ParsedTransaction[]): {
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  byCategory: Record<string, { count: number; total: number }>;
  dateRange: { start: Date; end: Date } | null;
} {
  const debits = transactions.filter(t => t.type === 'debit');
  const credits = transactions.filter(t => t.type === 'credit');

  const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);

  const byCategory: Record<string, { count: number; total: number }> = {};
  transactions.forEach(t => {
    const cat = t.category || 'OTHER';
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, total: 0 };
    }
    byCategory[cat].count++;
    byCategory[cat].total += t.type === 'debit' ? t.amount : 0;
  });

  const dates = transactions.map(t => t.date.getTime()).filter(d => !isNaN(d));
  const dateRange = dates.length > 0
    ? { start: new Date(Math.min(...dates)), end: new Date(Math.max(...dates)) }
    : null;

  return {
    totalDebits,
    totalCredits,
    netAmount: totalCredits - totalDebits,
    byCategory,
    dateRange,
  };
}
