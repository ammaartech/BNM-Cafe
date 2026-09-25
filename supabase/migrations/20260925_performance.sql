-- ============================================================================
-- Performance: indexes, cheaper RLS, and the realtime publication
-- ============================================================================
-- HOW TO APPLY: run in the Supabase SQL editor (or `supabase db push`) AFTER
-- 20260620_core_rls.sql. Idempotent; safe to re-run.
--
-- 1. Indexes. Every hot query filters or sorts on a column that had no index
--    (orders.user_id, orders.order_date, order_items.order_id, ...), so each one
--    was a sequential scan that got slower with every order placed.
--
-- 2. RLS. Policies called auth.uid() and public.is_admin() bare, which Postgres
--    may evaluate once PER ROW. Wrapping them in (select ...) makes each an
--    InitPlan evaluated once PER QUERY. The rules themselves are unchanged —
--    only the call is wrapped. Realtime benefits too: it runs the select policy
--    for every change, for every subscriber.
--
-- 3. Realtime. postgres_changes only fires for tables in the supabase_realtime
--    publication; a table missing from it silently never updates the UI.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Indexes
-- ---------------------------------------------------------------------------
create index if not exists orders_user_id_order_date_idx on public.orders (user_id, order_date desc);
create index if not exists orders_order_date_idx         on public.orders (order_date desc);
create index if not exists orders_live_status_idx        on public.orders (status) where status in ('PENDING', 'READY');
create index if not exists orders_payment_pending_idx    on public.orders (order_date) where payment_status = 'PENDING';
create index if not exists order_items_order_id_idx      on public.order_items (order_id);
create index if not exists order_stations_order_id_idx   on public.order_stations (order_id);
create index if not exists order_stations_station_status_idx on public.order_stations (station_id, status);
create index if not exists user_cart_items_user_id_idx   on public.user_cart_items (user_id);
create index if not exists user_favorites_user_id_idx    on public.user_favorites (user_id);
create index if not exists customer_feedbacks_user_id_idx on public.customer_feedbacks (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. RLS: same rules, evaluated once per query
-- ---------------------------------------------------------------------------

-- users
drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin" on public.users
  for select using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin" on public.users
  for update using (id = (select auth.uid()) or (select public.is_admin()))
             with check (id = (select auth.uid()) or (select public.is_admin()));

-- orders
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "orders_insert_own_or_admin" on public.orders;
create policy "orders_insert_own_or_admin" on public.orders
  for insert with check (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "orders_update_own_or_admin" on public.orders;
create policy "orders_update_own_or_admin" on public.orders
  for update using (user_id = (select auth.uid()) or (select public.is_admin()))
             with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- order_items
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    (select public.is_admin())
    or order_id in (select id from public.orders where user_id = (select auth.uid()))
  );

-- order_stations
drop policy if exists "order_stations_select_own_or_admin" on public.order_stations;
create policy "order_stations_select_own_or_admin" on public.order_stations
  for select using (
    (select public.is_admin())
    or order_id in (select id from public.orders where user_id = (select auth.uid()))
  );

-- user_cart_items / user_favorites
drop policy if exists "user_cart_items_owner_all" on public.user_cart_items;
create policy "user_cart_items_owner_all" on public.user_cart_items
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "user_favorites_owner_all" on public.user_favorites;
create policy "user_favorites_owner_all" on public.user_favorites
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- customer_feedbacks
drop policy if exists "Users can view their own feedback." on public.customer_feedbacks;
create policy "Users can view their own feedback." on public.customer_feedbacks
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Admins can view all feedback." on public.customer_feedbacks;
create policy "Admins can view all feedback." on public.customer_feedbacks
  for select using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 3. Realtime publication
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'order_stations', 'menu_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

commit;
