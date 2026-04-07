# Vault & Vine Dashboard

A modern, glassmorphic retail operations dashboard for regional/district managers overseeing multiple general merchandise stores. Built with Next.js, Supabase, Tailwind CSS, and Recharts.

## Live Demo

[View Live Demo](https://retail-ops-dashboard-seven.vercel.app/)

**Demo Credentials:**
- Manager: `manager@retailops.com` / `password123`
- Assistant: `assistant@retailops.com` / `password123`

## Features

- **Multi-Store Dashboard** — KPI cards, sales trend charts, revenue/profit visualization, store selector
- **Product Management** — Full CRUD, search/filter by name and category, image display, detail pages
- **Inventory Tracking** — Status badges (in-stock/low/out/arriving), contextual actions menu, order more stock, turnover chart
- **Financial Analytics** — Revenue by store, monthly trends, profit margins, gross profit breakdown
- **Team Management** — Role-based access (manager/assistant), store assignments, member editing
- **Settings** — Profile management, light/dark/system theme toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| UI Primitives | Radix UI (Dialog, Dropdown) |
| Icons | Lucide React |
| Types | TypeScript (strict) |

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sconover88/retail-ops-dashboard
   cd retail-ops-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/` via the SQL Editor
   - Copy your project URL, anon key, and service role key

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The database seeds automatically on first load.

## Inventory Management

The inventory table displays all products across stores with sortable columns, searchable multi-select filters, and pagination.

**Statuses:**
| Status | Meaning |
|--------|---------|
| **In Stock** (green) | Quantity is above the reorder point |
| **Low Stock** (amber) | Quantity is at or below the reorder point |
| **Out of Stock** (red) | Quantity is zero |
| **Arriving** (blue) | An order has been placed — shows the expected arrival date and incoming quantity |

**Ordering more product:**
1. Find a **Low Stock** or **Out of Stock** item in the inventory table.
2. Click the **⋯** menu in the **Actions** column.
3. Select **Order More**.
4. Enter the quantity you'd like to order and click **Place Order**.
5. The item's status will change to **Arriving** with an estimated delivery date (3–7 business days).

**Editing inventory:**
1. Click the **⋯** menu on any row.
2. Select **Edit** to update the current quantity or reorder point.

## Database Schema

- **stores** — Store locations with name and address
- **products** — Product catalog with SKU, category, price, image
- **inventory** — Per-store stock levels with reorder points, arriving order tracking
- **sales** — Transaction records with date, quantity, price
- **profiles** — User profiles extending Supabase Auth (role: manager/assistant)
- **user_stores** — Many-to-many store assignments

Row Level Security is enabled on all tables with role-based policies.

## Deployment

This project is configured for automatic deployment to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
4. Deploy
- UI inspiration from Dribbble

## Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Project Link: [https://github.com/yourusername/retail-ops-dashboard](https://github.com/yourusername/retail-ops-dashboard)

Built with ❤️ for the Protogen class
