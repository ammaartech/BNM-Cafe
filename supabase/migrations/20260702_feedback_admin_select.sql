-- ============================================================================
-- Allow admins to read all customer feedback.
-- ============================================================================
-- The original customer_feedbacks policies only let a user read their OWN
-- feedback (auth.uid() = user_id). The admin feedback dashboard therefore
-- rendered an empty table for admins. Reuse public.is_admin() (defined in
-- 20260620_core_rls.sql) to grant admins full read access.
--
-- HOW TO APPLY: run in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

drop policy if exists "Admins can view all feedback." on public.customer_feedbacks;
create policy "Admins can view all feedback." on public.customer_feedbacks
  for select
  using (public.is_admin());
