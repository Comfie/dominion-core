// Backfill script: re-categorize existing Income records that were saved with
// source = 'OTHER' (the default before income auto-categorization existed)
// using the same keyword detection now used during bank statement import.
//
// Dry run (default, no writes):
//   npx tsx scripts/backfill-income-sources.ts
//
// Apply changes:
//   npx tsx scripts/backfill-income-sources.ts --apply

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { categorizeIncomeSource } from '../lib/bankStatementParser';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`Scanning Income records with source = OTHER (${APPLY ? 'APPLY mode' : 'dry run'})...\n`);

  const candidates = await prisma.income.findMany({
    where: { source: 'OTHER' },
    select: { id: true, name: true, amount: true, date: true, userId: true },
    orderBy: { date: 'desc' },
  });

  console.log(`Found ${candidates.length} income record(s) currently labeled OTHER.\n`);

  const changes = candidates
    .map(record => ({ record, newSource: categorizeIncomeSource(record.name) }))
    .filter(({ newSource }) => newSource !== 'OTHER');

  if (changes.length === 0) {
    console.log('No records match a known income source keyword. Nothing to do.');
    return;
  }

  console.log(`${changes.length} record(s) would be re-categorized:\n`);
  for (const { record, newSource } of changes) {
    console.log(`  ${record.date.toISOString().slice(0, 10)}  R${Number(record.amount).toFixed(2).padStart(10)}  "${record.name}"  OTHER -> ${newSource}`);
  }

  if (!APPLY) {
    console.log('\nDry run only — no changes written. Re-run with --apply to save these updates.');
    return;
  }

  console.log('\nApplying updates...');
  let updated = 0;
  for (const { record, newSource } of changes) {
    await prisma.income.update({
      where: { id: record.id },
      data: { source: newSource as any },
    });
    updated++;
  }
  console.log(`Done — updated ${updated} record(s).`);
}

main()
  .catch(err => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
