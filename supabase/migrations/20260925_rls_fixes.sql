-- ============================================================================
-- Fixes needed for 20260620_core_rls.sql to work against the live app
-- ============================================================================
-- HOW TO APPLY: run AFTER 20260620_core_rls.sql. Idempotent; safe to re-run.
--
-- 1. Legacy policies. The database carried an older set of policies that
--    core_rls never dropped. Once RLS is on, every permissive policy is OR'ed
--    together, so the old ones would quietly widen access — notably
--    "Enable insert for authenticated users only" on users, which lets a
--    signed-in user create their own profile row with ANY role, including
--    'admin'. core_rls already covers each of them with an equal or stricter
--    rule, so they are dropped.
--
-- 2. Server-side writers. The two guard triggers from core_rls let only an
--    admin *user* change protected columns. The Razorpay callback runs with the
--    service-role key and the SQL editor runs as postgres — neither has a user,
--    so is_admin() is false and every payment confirmation would be rejected.
--    A request with no user is either one of those trusted contexts or an
--    anonymous API call, and RLS stops anonymous calls before the trigger runs.
--
-- 3. create_new_order. It numbered orders by counting today's rows. Under RLS
--    a customer only sees their own rows, so every customer's first order of
--    the day would be "A-001". It now runs as definer (seeing every order) and
--    checks itself that a customer only creates orders for themselves.
--
-- 4. Sign-up profiles. The app inserted the public.users row from the browser
--    right after sign-up — before the email is confirmed, so with no session,
--    which RLS rejects. A trigger now creates the row with the account.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Legacy policies superseded by core_rls
-- ---------------------------------------------------------------------------
drop policy if exists "Admins have full access to orders"              on public.orders;
drop policy if exists "Allow users to view their own orders"           on public.orders;
drop policy if exists "Customers can update their own orders"          on public.orders;
drop policy if exists "Customers can view their own orders"            on public.orders;
drop policy if exists "Admins can view all order items"                on public.order_items;
drop policy if exists "Allow users to add items to their own orders"   on public.order_items;
drop policy if exists "Allow users to view items in their own orders"  on public.order_items;
drop policy if exists "Enable delete for own cart items"               on public.user_cart_items;
drop policy if exists "Enable insert for own cart items"               on public.user_cart_items;
drop policy if exists "Enable read access for own cart items"          on public.user_cart_items;
drop policy if exists "Enable update for own cart items"               on public.user_cart_items;
drop policy if exists "Allow users to manage their own favorites"      on public.user_favorites;
drop policy if exists "Allow users to update their own profile"        on public.users;
drop policy if exists "Allow users to view their own profile"          on public.users;
drop policy if exists "Enable insert for authenticated users only"     on public.users;

-- ---------------------------------------------------------------------------
-- 2. Guard triggers: trust contexts that have no user
-- ---------------------------------------------------------------------------
create or replace function public.enforce_order_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins, the service-role payment callback and the SQL editor.
  if auth.uid() is null or public.is_admin() then
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

create or replace function public.enforce_user_role_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. create_new_order: global numbering, explicit ownership check
-- ---------------------------------------------------------------------------
create or replace function public.create_new_order(
  user_id_param uuid,
  user_name_param text,
  total_amount_param numeric,
  order_items_param jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item jsonb;
  today_count integer;
  display_id text;
begin
  -- Runs as definer, so RLS no longer checks ownership for us.
  if user_id_param is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Not allowed to create an order for another user';
  end if;

  -- Count today's orders. A range rather than order_date::date, so the
  -- orders_order_date_idx index can be used; the day boundaries are the same.
  select count(*)
  into today_count
  from orders
  where order_date >= current_date
    and order_date < current_date + 1;

  -- Generate display order ID (A-001)
  display_id := 'A-' || lpad((today_count + 1)::text, 3, '0');

  insert into orders (user_id, user_name, total_amount, status, order_date, display_order_id)
  values (user_id_param, user_name_param, total_amount_param, 'PENDING'::order_status, now(), display_id)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(order_items_param)
  loop
    insert into order_items (order_id, name, price, quantity, menu_item_uuid, status)
    values (
      new_order_id,
      item->>'name',
      (item->>'price')::numeric,
      (item->>'quantity')::int,
      (item->>'menu_item_uuid')::uuid,
      'PENDING'::order_status
    );
  end loop;

  return jsonb_build_object('order_id', new_order_id, 'display_order_id', display_id);
end;
$$;

revoke execute on function public.create_new_order(uuid, text, numeric, jsonb) from anon, public;
grant execute on function public.create_new_order(uuid, text, numeric, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Create the profile row together with the auth account
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. daily_order_counters: unused leftover, but open to the anon key
-- ---------------------------------------------------------------------------
-- Nothing in the app or the database reads it. Its only policy is
-- service_role-only; enabling RLS makes that policy actually apply.
alter table public.daily_order_counters enable row level security;

commit;
