create table public.customer_feedbacks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  order_id text null,
  name text null,
  phone text not null,
  email text not null,
  body text not null,
  created_at timestamp with time zone not null default now(),
  constraint customer_feedbacks_pkey primary key (id),
  constraint customer_feedbacks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- set up row level security
alter table public.customer_feedbacks enable row level security;

-- policy to allow users to insert their own feedback
create policy "Users can insert their own feedback." on public.customer_feedbacks
  for insert
  with check (auth.uid() = user_id);

-- policy to allow users to read their own feedback
create policy "Users can view their own feedback." on public.customer_feedbacks
  for select
  using (auth.uid() = user_id);
