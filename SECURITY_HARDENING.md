# Security Hardening — status & manual follow-ups

This documents the security hardening pass. Items marked **MANUAL** require action
outside the codebase (Supabase dashboard, Razorpay dashboard, hosting platform).

## Done in this codebase
- **Secrets removed from git** — `.env` is now untracked and gitignored; `.env.example`
  documents required vars. (`src/.env`, `.gitignore`, `.env.example`)
- **RLS migration added** — `supabase/migrations/20260620_core_rls.sql` enables RLS and
  policies on `users, orders, order_items, menu_items, user_cart_items, user_favorites,
  stations, order_stations`, plus an `is_admin()` helper and triggers blocking
  self-promotion and order money/status tampering.
- **Razorpay callback hardened** — `src/app/api/razorpay/verify/route.ts` no longer falls
  back to the anon key, validates the paid amount against `orders.total_amount`, and is
  idempotent (only flips `PENDING → PAID`).
- **Dead `/api/migrate` route deleted.**

## MANUAL — do these to finish

1. **Rotate the leaked credentials** (they remain in git history):
   - Razorpay: regenerate key id + secret (dashboard → Settings → API Keys).
   - Supabase: roll the anon key (Project Settings → API). Note the **service role key**
     and set it as `SUPABASE_SERVICE_ROLE_KEY` in the host env (required by the payment
     callback — it is intentionally not in `.env.example` values).
   - Optionally scrub history: `git filter-repo --path .env --invert-paths` then force-push.

2. **Apply the RLS migration** to the live DB (Supabase SQL editor or `supabase db push`).
   It runs in one transaction; if a table/column name differs from the assumptions listed
   at the top of the file, fix the name and re-run. Then run the verification below.

3. **Verify `create_new_order` recomputes the total server-side** (§5). The client sends
   `total_amount` from the browser (`src/context/CartContext.tsx`). Open the function in the
   Supabase dashboard (Database → Functions). If it trusts the client value, change it to
   recompute from `menu_items.price * quantity`. Then check the function source into
   `supabase/migrations/` so it stops being invisible.

4. **(Optional, stronger) Server-side admin UI gating** (§3). The data is already safe via
   RLS, so the client-side role check in `src/app/admin/layout.tsx` /
   `src/app/station/page.tsx` is now UX-only, not a security boundary. To gate the UI on the
   server, migrate auth to cookie-based sessions with `@supabase/ssr` and add a `middleware.ts`
   protecting `/admin/:path*` and `/station/:path*`. Deferred — not required for the pilot.

## Verification (after applying the migration)
- **RLS isolation:** with two customer accounts A and B, as A run in the browser console
  `await supabase.from('orders').select('*')` → only A's rows; try updating B's order or
  setting your own `users.role='admin'` → denied. Repeat for `user_cart_items`.
- **Customer happy path:** menu → cart → checkout → order tracking still works; realtime
  status updates still arrive.
- **Staff path:** as an `admin` user, `/admin`, `/admin/cashier`, `/station/[code]` load and
  status transitions persist (`syncOrderStatus` works under RLS).
- **Payment:** a genuine Razorpay payment flips the order to `PAID`; a replayed callback or a
  tampered amount is a no-op / rejected.
