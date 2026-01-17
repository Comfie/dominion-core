// Seed script for demo account
// Run with: npx tsx scripts/seed-demo.ts

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Setting up demo account...\n');

  // 1. Create demo user
  console.log('👤 Creating demo user...');
  const hashedPassword = await hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@dominioncore.com' },
    update: {
      password: hashedPassword,
      name: 'Demo User',
    },
    create: {
      email: 'demo@dominioncore.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });
  console.log(`   ✓ User created: ${user.email}\n`);

  // 2. Create settings
  console.log('⚙️  Configuring settings...');
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {
      monthlyIncome: 45000,
      monthlyBudget: 15000,
      payday: 25,
      currency: 'ZAR',
    },
    create: {
      userId: user.id,
      monthlyIncome: 45000,
      monthlyBudget: 15000,
      payday: 25,
      currency: 'ZAR',
    },
  });
  console.log('   ✓ Settings configured (R45,000 income, R15,000 budget)\n');

  // 3. Create persons (family members)
  console.log('👨‍👩‍👧 Creating family members...');

  // Delete existing persons first
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.obligation.updateMany({
    where: { userId: user.id },
    data: { personId: null }
  });
  await prisma.person.deleteMany({ where: { userId: user.id } });

  const wife = await prisma.person.create({
    data: {
      userId: user.id,
      name: 'Wife',
      budgetLimit: 5000,
    },
  });

  const kids = await prisma.person.create({
    data: {
      userId: user.id,
      name: 'Kids',
      budgetLimit: 3000,
    },
  });

  const mom = await prisma.person.create({
    data: {
      userId: user.id,
      name: 'Mom',
      budgetLimit: 2000,
    },
  });
  console.log('   ✓ Created: Wife (R5,000), Kids (R3,000), Mom (R2,000)\n');

  // 4. Create obligations (debit orders)
  console.log('💳 Creating obligations...');

  // Delete existing payments and obligations
  await prisma.payment.deleteMany({ where: { userId: user.id } });
  await prisma.obligation.deleteMany({ where: { userId: user.id } });

  const obligations = [
    // Housing
    { name: 'Home Loan', provider: 'ABSA Bank', category: 'HOUSING', amount: 12500, totalBalance: 1450000, interestRate: 11.75, debitOrderDate: 1, isUncompromised: true },
    { name: 'Body Corporate Levy', provider: 'Estate Management', category: 'HOUSING', amount: 2800, debitOrderDate: 1, isUncompromised: true },

    // Debt
    { name: 'Car Finance', provider: 'WesBank', category: 'DEBT', amount: 5200, totalBalance: 185000, interestRate: 13.5, debitOrderDate: 1, isUncompromised: true },
    { name: 'Credit Card', provider: 'FNB', category: 'DEBT', amount: 2500, totalBalance: 28000, interestRate: 21.75, debitOrderDate: 25, isUncompromised: false },

    // Insurance
    { name: 'Car Insurance', provider: 'Discovery Insure', category: 'INSURANCE', amount: 1850, debitOrderDate: 1, isUncompromised: true },
    { name: 'Life Cover', provider: 'Sanlam', category: 'INSURANCE', amount: 980, debitOrderDate: 1, isUncompromised: true },
    { name: 'Medical Aid', provider: 'Discovery Health', category: 'INSURANCE', amount: 4200, debitOrderDate: 1, isUncompromised: true },

    // Utilities
    { name: 'Electricity', provider: 'City Power', category: 'UTILITIES', amount: 1800, debitOrderDate: 7, isUncompromised: true },
    { name: 'Fibre Internet', provider: 'Vumatel', category: 'UTILITIES', amount: 999, debitOrderDate: 1, isUncompromised: true },
    { name: 'Mobile Contract', provider: 'Vodacom', category: 'UTILITIES', amount: 599, debitOrderDate: 1, isUncompromised: true },

    // Savings
    { name: 'Retirement Annuity', provider: 'Allan Gray', category: 'SAVINGS', amount: 2000, debitOrderDate: 1, isUncompromised: true },
    { name: 'Emergency Fund', provider: 'FNB Save', category: 'SAVINGS', amount: 1500, debitOrderDate: 25, isUncompromised: true },

    // Living
    { name: 'Netflix', provider: 'Netflix', category: 'ENTERTAINMENT', amount: 199, debitOrderDate: 15, isUncompromised: false },
    { name: 'Spotify Family', provider: 'Spotify', category: 'ENTERTAINMENT', amount: 119, debitOrderDate: 12, isUncompromised: false },
    { name: 'Gym Membership', provider: 'Virgin Active', category: 'LIVING', amount: 899, debitOrderDate: 1, isUncompromised: false },
  ];

  for (const obl of obligations) {
    await prisma.obligation.create({
      data: {
        userId: user.id,
        name: obl.name,
        provider: obl.provider,
        category: obl.category as any,
        amount: obl.amount,
        totalBalance: obl.totalBalance,
        interestRate: obl.interestRate,
        debitOrderDate: obl.debitOrderDate,
        isUncompromised: obl.isUncompromised,
        isActive: true,
      },
    });
  }
  console.log(`   ✓ Created ${obligations.length} obligations\n`);

  // 5. Create payments for current month
  console.log('💰 Recording payments...');
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-01"
  const allObligations = await prisma.obligation.findMany({ where: { userId: user.id } });

  // Mark most obligations as paid for this month
  const paidObligations = allObligations.filter(o => o.debitOrderDate <= new Date().getDate());
  for (const obl of paidObligations) {
    await prisma.payment.create({
      data: {
        userId: user.id,
        obligationId: obl.id,
        amount: obl.amount,
        paidAt: new Date(new Date().getFullYear(), new Date().getMonth(), obl.debitOrderDate),
        month: currentMonth,
      },
    });
  }
  console.log(`   ✓ Recorded ${paidObligations.length} payments for ${currentMonth}\n`);

  // 6. Create expenses
  console.log('🛒 Adding expenses...');
  const now = new Date();
  const expenses = [
    // Groceries
    { name: 'Woolworths Food', amount: 2450, category: 'GROCERIES', daysAgo: 2 },
    { name: 'Checkers Sixty60', amount: 680, category: 'GROCERIES', daysAgo: 5 },
    { name: 'Pick n Pay', amount: 1890, category: 'GROCERIES', daysAgo: 8 },
    { name: 'Fruit & Veg City', amount: 420, category: 'GROCERIES', daysAgo: 3 },

    // Transport
    { name: 'Petrol - Shell', amount: 1200, category: 'TRANSPORT', daysAgo: 1 },
    { name: 'Petrol - Engen', amount: 950, category: 'TRANSPORT', daysAgo: 7 },
    { name: 'Uber to Airport', amount: 380, category: 'TRANSPORT', daysAgo: 10 },

    // Dining
    { name: 'Nandos - Family Dinner', amount: 850, category: 'DINING', daysAgo: 4 },
    { name: 'Mugg & Bean Breakfast', amount: 420, category: 'DINING', daysAgo: 6 },
    { name: 'Uber Eats - Pizza', amount: 295, category: 'DINING', daysAgo: 2 },

    // Shopping
    { name: 'Cotton On - Kids clothes', amount: 1200, category: 'SHOPPING', daysAgo: 5, personId: kids.id },
    { name: 'Clicks - Toiletries', amount: 680, category: 'SHOPPING', daysAgo: 3 },
    { name: 'Takealot - Electronics', amount: 1499, category: 'SHOPPING', daysAgo: 9 },

    // Entertainment
    { name: 'Movies - Ster Kinekor', amount: 380, category: 'ENTERTAINMENT', daysAgo: 6 },
    { name: 'Books - Exclusive Books', amount: 450, category: 'ENTERTAINMENT', daysAgo: 11 },

    // For Wife
    { name: 'Hair Salon', amount: 1800, category: 'SHOPPING', daysAgo: 4, personId: wife.id },
    { name: 'Dis-Chem - Beauty', amount: 950, category: 'SHOPPING', daysAgo: 7, personId: wife.id },

    // For Mom
    { name: 'Medication - Clicks', amount: 650, category: 'OTHER', daysAgo: 8, personId: mom.id },
    { name: 'Groceries for Mom', amount: 1200, category: 'GROCERIES', daysAgo: 5, personId: mom.id },
  ];

  for (const exp of expenses) {
    const date = new Date(now);
    date.setDate(date.getDate() - exp.daysAgo);

    await prisma.expense.create({
      data: {
        userId: user.id,
        name: exp.name,
        amount: exp.amount,
        category: exp.category as any,
        date: date,
        personId: exp.personId || null,
      },
    });
  }
  console.log(`   ✓ Added ${expenses.length} expenses\n`);

  // 7. Create income entries
  console.log('💵 Adding income entries...');
  const incomes = [
    { name: 'Freelance Web Project', amount: 8500, source: 'FREELANCE', daysAgo: 12 },
    { name: 'Sold old laptop', amount: 3500, source: 'SALE', daysAgo: 8 },
    { name: 'Tax Refund', amount: 4200, source: 'REFUND', daysAgo: 15 },
  ];

  await prisma.income.deleteMany({ where: { userId: user.id } });

  for (const inc of incomes) {
    const date = new Date(now);
    date.setDate(date.getDate() - inc.daysAgo);

    await prisma.income.create({
      data: {
        userId: user.id,
        name: inc.name,
        amount: inc.amount,
        source: inc.source as any,
        date: date,
        isRecurring: false,
      },
    });
  }
  console.log(`   ✓ Added ${incomes.length} income entries\n`);

  console.log('═══════════════════════════════════════════');
  console.log('✅ Demo account setup complete!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📧 Email:    demo@dominioncore.com');
  console.log('🔑 Password: demo1234');
  console.log('');
  console.log('Summary:');
  console.log(`   • Monthly Income: R45,000`);
  console.log(`   • ${obligations.length} Obligations (debit orders)`);
  console.log(`   • ${expenses.length} Expenses this month`);
  console.log(`   • ${incomes.length} Extra income entries`);
  console.log(`   • 3 Family members with budgets`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
