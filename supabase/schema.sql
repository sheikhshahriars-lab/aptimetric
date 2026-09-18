-- =====================================================================
-- APTIMETRIC — DATABASE SCHEMA (run ONCE in Supabase Dashboard → SQL Editor)
-- Run this entire script top-to-bottom. It is safe to run: creates
-- profiles, results, organizations, invitations + RLS + SQL functions.
-- NOTE: tables are created BEFORE the functions/policies that reference
-- them, so the script runs cleanly from top to bottom.
-- =====================================================================

-- 1. PROFILES TABLE + SIGNUP TRIGGER ----------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  plan        text not null default 'free' check (plan in ('free','premium')),
  role        text not null default 'user' check (role in ('user','recruiter','admin')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- auto-create a profile when a brand-new signup happens
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill profiles for accounts that already exist
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- make the owner an admin (change the email below if needed)
update public.profiles p
set role = 'admin', plan = 'premium'
from auth.users u
where p.id = u.id and u.email = 'sheikhshahriars@gmail.com';

-- 2. SECURITY HELPER FUNCTIONS ----------------------------------------
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user');
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 3. PROFILES POLICIES -------------------------------------------------
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id or public.app_is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id or public.app_is_admin())
  with check (auth.uid() = id or public.app_is_admin());

-- 4. ASSESSMENT RESULTS -------------------------------------------------
create table if not exists public.assessment_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  completed_at   timestamptz not null default now(),
  iq_score       numeric(6,1),
  iq_ci_lower    numeric(6,1),
  iq_ci_upper    numeric(6,1),
  percentile     numeric(5,2),
  overall_theta  numeric(6,3),
  overall_sem    numeric(6,3),
  classification text,
  domains        jsonb not null default '{}'::jsonb,
  answers        jsonb not null default '[]'::jsonb,
  domain_counts  jsonb not null default '{}'::jsonb,
  duration_ms    integer not null default 0,
  tab_switches   integer not null default 0,
  suspicious     integer not null default 0,
  status         text not null default 'completed' check (status in ('completed','flagged','void')),
  invitation_token text,
  created_at     timestamptz not null default now()
);

alter table public.assessment_results enable row level security;

drop policy if exists "results insert own" on public.assessment_results;
create policy "results insert own" on public.assessment_results
  for insert with check (auth.uid() = user_id);

drop policy if exists "results select own" on public.assessment_results;
create policy "results select own" on public.assessment_results
  for select using (auth.uid() = user_id or public.app_is_admin());

create index if not exists results_user_idx on public.assessment_results (user_id, completed_at desc);

-- 5. ORGANIZATIONS (recruiter accounts) ---------------------------------
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

drop policy if exists "orgs select owner" on public.organizations;
create policy "orgs select owner" on public.organizations
  for select using (owner_id = auth.uid() or public.app_is_admin());

drop policy if exists "orgs insert owner" on public.organizations;
create policy "orgs insert owner" on public.organizations
  for insert with check (owner_id = auth.uid());

drop policy if exists "orgs update owner" on public.organizations;
create policy "orgs update owner" on public.organizations
  for update using (owner_id = auth.uid() or public.app_is_admin())
  with check (owner_id = auth.uid() or public.app_is_admin());

-- 6. INVITATIONS ---------------------------------------------------------
create table if not exists public.invitations (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  candidate_email text not null,
  token          text not null unique,
  status         text not null default 'pending' check (status in ('pending','completed','revoked')),
  invited_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '14 days',
  result_id      uuid references public.assessment_results(id) on delete set null,
  iq_score       numeric(6,1),
  completed_at   timestamptz
);

alter table public.invitations enable row level security;

drop policy if exists "invitations select owner" on public.invitations;
create policy "invitations select owner" on public.invitations
  for select using (
    exists(select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid())
    or public.app_is_admin()
  );

drop policy if exists "invitations insert owner" on public.invitations;
create policy "invitations insert owner" on public.invitations
  for insert with check (
    exists(select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid())
    or public.app_is_admin()
  );

create index if not exists invitations_token_idx on public.invitations (token);
create index if not exists invitations_org_idx on public.invitations (org_id, invited_at desc);

-- 7. RECRUITER + CANDIDATE SQL FUNCTIONS ----------------------------------
create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_org_id uuid;
begin
  update public.profiles set role = 'recruiter' where id = auth.uid();
  insert into public.organizations (owner_id, name)
  values (auth.uid(), btrim(p_name))
  returning id into v_org_id;
  return v_org_id;
end;
$$;

create or replace function public.get_my_org()
returns table(id uuid, name text, created_at timestamptz, invite_count bigint, completed_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select o.id, o.name, o.created_at,
         count(i.id) filter (where i.status in ('pending','completed')) as invite_count,
         count(i.id) filter (where i.status = 'completed') as completed_count
  from public.organizations o
  left join public.invitations i on i.org_id = o.id
  where o.owner_id = auth.uid()
  group by o.id;
end;
$$;

create or replace function public.create_invitation(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text;
begin
  if not exists (select 1 from public.organizations where owner_id = auth.uid()) then
    raise exception 'You must create an organization first';
  end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.invitations (org_id, candidate_email, token)
  select id, lower(btrim(p_email)), v_token
  from public.organizations
  where owner_id = auth.uid();
  return v_token;
end;
$$;

create or replace function public.list_my_invitations()
returns table(email text, status text, token text, iq_score numeric, invited_at timestamptz, completed_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select i.candidate_email, i.status, i.token, i.iq_score, i.invited_at, i.completed_at
  from public.invitations i
  where exists (select 1 from public.organizations o where o.id = i.org_id and o.owner_id = auth.uid())
  order by i.invited_at desc;
$$;

create or replace function public.revoke_invitation(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invitations i
  set status = 'revoked'
  where i.token = p_token
    and exists (select 1 from public.organizations o where o.id = i.org_id and o.owner_id = auth.uid());
  return found;
end;
$$;

-- public read for a candidate who opens the invite link
create or replace function public.get_invitation(p_token text)
returns table(org_name text, candidate_email text, status text, iq_score numeric, completed_at timestamptz, expires_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select o.name, i.candidate_email, i.status, i.iq_score, i.completed_at, i.expires_at
  from public.invitations i
  join public.organizations o on o.id = i.org_id
  where i.token = p_token;
$$;

-- called after a candidate completes the test via an invite link
create or replace function public.complete_invitation(
  p_token text,
  p_user_email text,
  p_result_id uuid,
  p_iq numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare r invitations%rowtype;
begin
  select * into r from public.invitations where token = p_token;
  if not found then
    return false;
  end if;
  if lower(r.candidate_email) <> lower(p_user_email) then
    return false;
  end if;
  if r.status <> 'pending' or r.expires_at < now() then
    return false;
  end if;
  -- ensure the result actually belongs to the calling user
  if not exists (
    select 1 from public.assessment_results ar
    where ar.id = p_result_id and ar.user_id = auth.uid()
  ) then
    return false;
  end if;
  update public.invitations
  set status = 'completed', result_id = p_result_id, iq_score = p_iq, completed_at = now()
  where id = r.id;
  return true;
end;
$$;

-- 8. ADMIN SQL FUNCTIONS ---------------------------------------------------
create or replace function public.admin_users()
returns table(id uuid, email text, full_name text, plan text, role text, created_at timestamptz)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.app_is_admin() then
    raise exception 'Forbidden';
  end if;
  return query
    select p.id, u.email, p.full_name, p.plan, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_profile(p_user_id uuid, p_plan text default null, p_role text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.app_is_admin() then
    raise exception 'Forbidden';
  end if;
  update public.profiles
  set plan = coalesce(p_plan, plan),
      role = coalesce(p_role, role)
  where id = p_user_id;
end;
$$;

-- 9. GRANTS ----------------------------------------------------------------
grant execute on function public.app_role() to authenticated;
grant execute on function public.app_is_admin() to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.get_my_org() to authenticated;
grant execute on function public.create_invitation(text) to authenticated;
grant execute on function public.list_my_invitations() to authenticated;
grant execute on function public.revoke_invitation(text) to authenticated;
grant execute on function public.get_invitation(text) to anon, authenticated;
grant execute on function public.complete_invitation(text, text, uuid, numeric) to authenticated;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_set_profile(uuid, text, text) to authenticated;

-- =====================================================================
-- DONE. After running, verify:
--   1) Open Table Editor → you should see profiles, assessment_results,
--      organizations, invitations tables.
--   2) Run this in SQL Editor to make sure you are admin:
--        select public.app_is_admin();
--      It should return true (the owner email row was promoted above).
-- =====================================================================