# B.N.M Cafe

A mobile-first cafe ordering app: customers browse the menu, pay at the counter or
online, and track their order live as the kitchen prepares it. Staff get a cashier POS,
per-station kitchen displays, and an admin dashboard with analytics.

## Tech stack

- **Next.js 15** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Supabase** — auth, Postgres, realtime, row-level security
- **Razorpay** — online payments
- **Tailwind CSS** + **shadcn/ui** (Radix) · **framer-motion** · **Recharts**
- **Genkit** + Google GenAI
- Deployed on **Firebase App Hosting**

## Surfaces

| Route | For | Purpose |
|-------|-----|---------|
| `/menu`, `/cart`, `/checkout`, `/orders` | Customers | Browse, order, pay, track live status |
| `/admin/cashier` | Cashiers | POS: take orders, take cash/UPI, clear pending payments |
| `/station`, `/station/[code]` | Kitchen | Per-station order tickets (KOT), mark items ready |
| `/admin`, `/admin/analytics` | Admin | Order management, sales analytics, feedback |

## Getting started

**Prerequisites:** Node.js 18+, a Supabase project, a Razorpay account.

```bash
npm install
cp .env.example .env   # then fill in the values
```

Apply the database schema by running the files in `supabase/migrations/` in the Supabase
SQL editor (or `supabase db push`). Then:

```bash
npm run dev            # http://localhost:9002
```

### Environment variables

See `.env.example`. `.env` is gitignored — never commit secrets.

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project + public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; required by the Razorpay payment callback |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay keys (secret is server-only) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 9002 (Turbopack) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run genkit:dev` | Run Genkit AI flows locally |

## Project structure

```
src/
  app/            Routes (App Router): customer, /admin, /station, /api
  components/     UI — shadcn/ui primitives + feature components
  context/        Cart, Cashier, OrderStatus, UserPreferences providers
  lib/            Supabase client, order-sync logic, types, utils
supabase/
  migrations/     Database schema + row-level security policies
```

## Security

Authorization is enforced in the database via Supabase row-level security
(`supabase/migrations/`). See [SECURITY_HARDENING.md](SECURITY_HARDENING.md) for the
hardening status and remaining manual steps (key rotation, applying RLS, payment checks).
