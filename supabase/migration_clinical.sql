-- =====================================================================
-- APTIMETRIC — CLINICAL UPGRADE MIGRATION
-- Paste this ENTIRE script into Supabase Dashboard → SQL Editor → Run.
--
-- Safe to run more than once. It:
--   1. Adds profiles.birth_year (age-norm scaffolding) + backfills it.
--   2. Updates the signup trigger so new accounts capture birth year.
--   3. Adds assessment_results.age_band.
--   4. Rescales the verbal question bank from the old 1-5 difficulty
--      scale to the new 1-12 scale.
-- =====================================================================

-- 1. AGE-NORM SCAFFOLDING ---------------------------------------------
alter table public.profiles add column if not exists birth_year integer;

-- Backfill from any birth_year already stored in signup metadata.
update public.profiles p
set birth_year = nullif(u.raw_user_meta_data->>'birth_year', '')::integer
from auth.users u
where u.id = p.id
  and p.birth_year is null
  and nullif(u.raw_user_meta_data->>'birth_year', '') ~ '^[0-9]{4}$';

-- 2. SIGNUP TRIGGER (capture birth year for new accounts) -------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, birth_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'birth_year', '')::integer
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. RESULT AGE BAND ---------------------------------------------------
alter table public.assessment_results add column if not exists age_band text;

-- 4. RESCALE VERBAL QUESTION BANK: difficulty 1-5  ->  1-12 ------------
-- The generators now emit 1-12 directly; this brings existing rows in line.
-- Mapping keeps monotonic ordering across the wider range.
update public.questions
set difficulty = least(12, greatest(1,
  round(((difficulty - 1) * 11.0 / 4.0) + 1)::int
))
where difficulty between 1 and 5;

-- =====================================================================
-- DONE. Verify the new columns exist:
--   select column_name from information_schema.columns
--   where table_name = 'profiles' and column_name = 'birth_year';
-- =====================================================================
