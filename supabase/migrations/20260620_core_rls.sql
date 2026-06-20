-- ============================================================================
-- Core Row-Level Security (RLS) for BNM Cafe
-- ============================================================================
-- Until now the business tables had no RLS, so the public anon key could read
-- and write any user's data. This migration makes the database the real
-- authorization boundary.
--
-- HOW TO APPLY: run in the Supabase SQL editor (or `supabase db push`). It is
-- idempotent and runs in a single transaction, so a wrong table/column name
-- aborts the whole thing cleanly — fix the name and re-run.
--
-- ASSUMPTIONS (confirmed against the app code, not the stale supabase/migration.sql):
--   users(id, role)                            role = 'admin' | 'customer'
--   menu_items(id, uuid, ...)                  public catalog
--   orders(id, user_id, status, payment_status, payment_method, total_amount)
--   order_items(id, order_id, ...)
--   user_cart_items(user_id, menu_item_uuid, quantity)
--   user_favorites(user_id, menu_item_id)
--   stations(id, ...)
--   order_stations(order_id, status, ...)
-- Staff (cashier/kitchen/admin) all run with users.role = 'admin' today.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Admin helper. SECURITY DEFINER so that policies on `users` can call it
-- without recursively triggering `users` RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ===========================================================================
-- users
-- ===========================================================================
alter table public.users enable row level security;

drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin" on public.users
  for select using (id = auth.uid() or public.is_admin());

-- Signup path: a new user may create only their own row, only as a customer.
drop policy if exists "users_insert_self_customer" on public.users;
create policy "users_insert_self_customer" on public.users
  for insert with check (id = auth.uid() and role = 'customer');

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin" on public.users
  for update using (id = auth.uid() or public.is_admin())
             with check (id = auth.uid() or public.is_admin());

drop policy if exists "users_delete_admin" on public.users;
create policy "users_delete_admin" on public.users
  for delete using (public.is_admin());

-- Block self-promotion: a non-admin must not change their own role.
create or replace function public.enforce_user_role_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_user_role on public.users;
create trigger trg_enforce_user_role
  before update on public.users
  for each row execute function public.enforce_user_role_rules();

-- ===========================================================================
-- menu_items  (public catalog: anyone may read, only admins may write)
-- ===========================================================================
alter table public.menu_items enable row level security;

drop policy if exists "menu_items_select_all" on public.menu_items;
create policy "menu_items_select_all" on public.menu_items
  for select using (true);

drop policy if exists "menu_items_insert_admin" on public.menu_items;
create policy "menu_items_insert_admin" on public.menu_items
  for insert with check (public.is_admin());

drop policy if exists "menu_items_update_admin" on public.menu_items;
create policy "menu_items_update_admin" on public.menu_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "menu_items_delete_admin" on public.menu_items;
create policy "menu_items_delete_admin" on public.menu_items
  for delete using (public.is_admin());

-- ===========================================================================
-- orders
-- Customers may read their own orders and update them (e.g. pickup_notified_at),
-- but a trigger forbids non-admins from touching status / payment / total.
-- ===========================================================================
alter table public.orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_own_or_admin" on public.orders;
create policy "orders_insert_own_or_admin" on public.orders
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_update_own_or_admin" on public.orders;
create policy "orders_update_own_or_admin" on public.orders
  for update using (user_id = auth.uid() or public.is_admin())
             with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- Protect money/status columns from customer tampering. Customers keep the
-- ability to set pickup_notified_at on their own order; everything sensitive
-- is admin-only (and the service-role payment callback bypasses RLS anyway).
create or replace function public.enforce_order_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.status        is distinct from old.status
     or new.payment_status is distinct from old.payment_status
     or new.payment_method is distinct from old.payment_method
     or new.total_amount   is distinct from old.total_amount
     or new.user_id        is distinct from old.user_id then
    raise exception 'Not allowed to modify protected order fields';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_order_update on public.orders;
create trigger trg_enforce_order_update
  before update on public.orders
  for each row execute function public.enforce_order_update_rules();

-- ===========================================================================
-- order_items  (owned transitively through the parent order)
-- ===========================================================================
alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or order_id in (select id from public.orders where user_id = auth.uid())
  );

drop policy if exists "order_items_insert_own_or_admin" on public.order_items;
create policy "order_items_insert_own_or_admin" on public.order_items
  for insert with check (
    public.is_admin()
    or order_id in (select id from public.orders where user_id = auth.uid())
  );

drop policy if exists "order_items_modify_admin" on public.order_items;
create policy "order_items_modify_admin" on public.order_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_delete_admin" on public.order_items;
create policy "order_items_delete_admin" on public.order_items
  for delete using (public.is_admin());

-- ===========================================================================
-- user_cart_items  (strictly private to the owner)
-- ===========================================================================
alter table public.user_cart_items enable row level security;

drop policy if exists "user_cart_items_owner_all" on public.user_cart_items;
create policy "user_cart_items_owner_all" on public.user_cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================================================
-- user_favorites  (strictly private to the owner)
-- ===========================================================================
alter table public.user_favorites enable row level security;

drop policy if exists "user_favorites_owner_all" on public.user_favorites;
create policy "user_favorites_owner_all" on public.user_favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================================================
-- stations  (any authenticated user may read; only admins manage)
-- ===========================================================================
alter table public.stations enable row level security;

drop policy if exists "stations_select_authenticated" on public.stations;
create policy "stations_select_authenticated" on public.stations
  for select using (auth.uid() is not null);

drop policy if exists "stations_modify_admin" on public.stations;
create policy "stations_modify_admin" on public.stations
  for all using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- order_stations  (customer may read their order's tickets; staff manage)
-- ===========================================================================
alter table public.order_stations enable row level security;

drop policy if exists "order_stations_select_own_or_admin" on public.order_stations;
create policy "order_stations_select_own_or_admin" on public.order_stations
  for select using (
    public.is_admin()
    or order_id in (select id from public.orders where user_id = auth.uid())
  );

drop policy if exists "order_stations_insert_own_or_admin" on public.order_stations;
create policy "order_stations_insert_own_or_admin" on public.order_stations
  for insert with check (
    public.is_admin()
    or order_id in (select id from public.orders where user_id = auth.uid())
  );

drop policy if exists "order_stations_modify_admin" on public.order_stations;
create policy "order_stations_modify_admin" on public.order_stations
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_stations_delete_admin" on public.order_stations;
create policy "order_stations_delete_admin" on public.order_stations
  for delete using (public.is_admin());
