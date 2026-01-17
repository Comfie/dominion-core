# Dominion Core

A personal finance dashboard designed to help you take control of your money. Track expenses, manage recurring obligations, monitor debt progress, and get AI-powered insights - all in one beautiful, mobile-first interface.

## Features

### Dashboard Overview
- **Free Cash Flow Calculator** - See exactly how much money you have left after all obligations and expenses
- **Burn Rate Tracker** - Monitor your total monthly fixed costs at a glance
- **Budget Alerts** - Get notified when you're approaching or exceeding budget limits
- **Cashflow Timeline** - Visual timeline of upcoming payments and due dates

### Expense Management
- **Quick Expense Entry** - Add expenses on the go with category and date tracking
- **AI Receipt Scanner** - Take a photo of any receipt and let AI extract the details automatically
- **Category Tracking** - Organize expenses by categories (Groceries, Dining, Transport, etc.)
- **Person-Based Budgets** - Set individual budget limits for family members

### Obligations & Recurring Payments
- **Debit Order Tracking** - Keep track of all recurring monthly payments
- **Payment Recording** - Log when obligations are paid with adjustment tracking
- **Due Date Reminders** - Never miss a payment with upcoming payment alerts
- **Provider Management** - Track which company/service each obligation is with

### Debt Management
- **Debt Progress Visualization** - See your debt payoff progress with visual charts
- **Balance Tracking** - Monitor total balances and interest rates
- **Payoff Projections** - Understand how long until you're debt-free

### Income Tracking
- **Multiple Income Sources** - Track salary, freelance, side hustles, and more
- **Extra Income Logging** - Record additional income like sales, gifts, or refunds
- **Recurring Income** - Mark income sources as recurring for accurate projections

### AI-Powered Features
- **Receipt Scanning** - Upload a receipt image and AI extracts store name, date, total, and suggests a category
- **Financial Insights** - Get personalized tips and observations about your spending patterns

### User Management
- **Secure Authentication** - Email/password login with encrypted credentials
- **Personal Settings** - Configure monthly income, payday, and currency preferences
- **Multi-User Support** - Each user has their own private financial data

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic Claude API
- **Animations**: Framer Motion
- **Charts**: Recharts
- **PWA**: Progressive Web App support for mobile installation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Railway, Supabase, etc.)
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dominion-core.git
cd dominion-core
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI (for receipt scanning and insights)
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

5. Generate Prisma client and push schema:
```bash
npx prisma generate
npx prisma db push
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) and create an account to get started.

## Project Structure

```
dominion-core/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (dashboard)/       # Dashboard pages (expenses, income, settings)
│   ├── api/               # API routes
│   └── page.tsx           # Main dashboard
├── components/
│   ├── dashboard/         # Dashboard widgets
│   ├── modals/            # Modal components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and helpers
├── prisma/                # Database schema
└── types/                 # TypeScript type definitions
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The build command is configured to use webpack mode for PWA compatibility:
```bash
npm run build
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- DigitalOcean App Platform
- Self-hosted with Docker

## PWA Support

Dominion Core is a Progressive Web App. Users can:
- Install it on their home screen (iOS/Android)
- Use it offline (limited functionality)
- Receive a native app-like experience

## Categories

### Expense Categories
- Housing, Debt, Living, Savings, Insurance
- Utilities, Transport, Groceries, Dining
- Entertainment, Shopping, Other

### Income Sources
- Salary, Freelance, Side Hustle, Sale
- Rental, Gift, Investment, Refund, Other

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/obligations` | GET, POST | List/create obligations |
| `/api/obligations/[id]` | GET, PUT, DELETE | Manage single obligation |
| `/api/expenses` | GET, POST | List/create expenses |
| `/api/incomes` | GET, POST | List/create income entries |
| `/api/payments` | GET, POST | List/record payments |
| `/api/persons` | GET, POST | Manage family members |
| `/api/settings` | GET, PUT | User settings |
| `/api/ai/scan-receipt` | POST | AI receipt scanning |
| `/api/ai/insights` | GET | AI financial insights |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

---

Built with love for anyone who wants to take control of their finances.
