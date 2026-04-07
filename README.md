# RetailOps Dashboard

A modern, glassmorphic retail operations dashboard for regional/district managers overseeing multiple general merchandise stores. Built with Next.js, Supabase, Tailwind CSS, and Recharts.

## Features

- **Multi-Store Dashboard** — KPI cards, sales trend charts, revenue/profit visualization, store selector
- **Product Management** — Full CRUD, search/filter by name and category, image display, detail pages
- **Inventory Tracking** — Status badges (in-stock/low/out), table with search, inline quantity editing, turnover chart
- **Financial Analytics** — Revenue by store, weekly/monthly trends, profit margins, gross profit breakdown
- **Team Management** — Role-based access (manager/assistant), store assignments, member editing
- **Settings** — Profile management, light/dark/system theme toggle, keyboard shortcuts
- **Accessibility** — WCAG 2.1 AA focus indicators, skip-to-content link, screen reader labels, reduced-motion support
- **Responsive** — Mobile sidebar with overlay, adaptive grids, touch-friendly controls
- **Glassmorphism UI** — Backdrop blur, translucent cards/buttons/modals, gradient backgrounds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v4 + custom glassmorphism |
| Charts | Recharts |
| State | React hooks + Zustand (available) |
| UI Primitives | Radix UI (Dialog, Dropdown) |
| Icons | Lucide React |
| Types | TypeScript (strict) |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run the database migration in Supabase SQL editor:
# supabase/migrations/001_initial_schema.sql

# Start development server
npm run dev

# Seed the database (click "Seed Data" on dashboard, or):
curl -X POST http://localhost:3000/api/seed
```

## Project Structure

```
app/
  (auth)/login/         # Login page
  (auth)/register/      # Registration page
  (dashboard)/          # Protected dashboard shell (layout + nav)
    page.tsx            # Home dashboard with KPIs + charts
    products/           # Product listing + detail + CRUD
    inventory/          # Inventory management + table
    finance/            # Financial analytics + charts
    team/               # Team management + roles
    settings/           # Profile + theme preferences
  api/seed/             # Database seeding endpoint
components/
  ui/                   # Glass card, button, input, modal, toggle, skeleton, error boundary, skip link
  charts/               # Sales trend, inventory turnover, revenue chart
  dashboard/            # KPI card, store selector, alert banner, product form modal
hooks/                  # useAuth, useStores, useProducts
lib/
  supabase/             # Client, server, middleware helpers
  types/                # TypeScript database types
  utils/                # Formatters, calculations, cn()
supabase/
  migrations/           # SQL schema with RLS policies
  seed.sql              # Sample store data
```

## Database Schema

- **stores** — Store locations with name and address
- **products** — Product catalog with SKU, category, price, image
- **inventory** — Per-store stock levels with reorder points
- **sales** — Transaction records with date, quantity, price
- **profiles** — User profiles extending Supabase Auth (role: manager/assistant)
- **user_stores** — Many-to-many store assignments

Row Level Security is enabled on all tables with role-based policies.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

Deploy to Vercel:

```bash
npm run build    # Verify production build
vercel           # Deploy
```

Set environment variables in your Vercel project settings.
