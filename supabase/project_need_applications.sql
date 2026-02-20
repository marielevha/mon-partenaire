-- Project need applications + project members (adhesion flow).
-- Safe to re-run.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'ProjectNeedApplicationStatus' and n.nspname = 'public'
  ) then
    create type public."ProjectNeedApplicationStatus" as enum (
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'ProjectMemberStatus' and n.nspname = 'public'
  ) then
    create type public."ProjectMemberStatus" as enum (
      'ACTIVE',
      'INACTIVE'
    );
  end if;
end $$;

create table if not exists public."ProjectNeedApplication" (
  "id" text primary key default gen_random_uuid()::text,
  "projectId" text not null references public."Project"("id") on delete cascade,
  "projectNeedId" text not null references public."ProjectNeed"("id") on delete cascade,
  "applicantUserId" text not null,
  "ownerUserId" text not null,
  "needType" text not null,
  "message" text null,
  "proposedAmount" integer null,
  "proposedRequiredCount" integer null,
  "proposedEquityPercent" integer null,
  "proposedSkillTags" text[] not null default array[]::text[],
  "status" public."ProjectNeedApplicationStatus" not null default 'PENDING',
  "decisionNote" text null,
  "decidedByUserId" text null,
  "decidedAt" timestamptz null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."ProjectMember" (
  "id" text primary key default gen_random_uuid()::text,
  "projectId" text not null references public."Project"("id") on delete cascade,
  "userId" text not null,
  "applicationId" text null unique references public."ProjectNeedApplication"("id") on delete set null,
  "engagementType" text not null,
  "status" public."ProjectMemberStatus" not null default 'ACTIVE',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("projectId", "userId")
);

-- Ensure ProjectNeed has requiredCount for SKILL acceptance logic.
alter table public."ProjectNeed"
  add column if not exists "requiredCount" integer null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_need_application_proposed_amount_positive'
  ) then
    alter table public."ProjectNeedApplication"
      add constraint project_need_application_proposed_amount_positive
      check ("proposedAmount" is null or "proposedAmount" > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_need_required_count_positive'
  ) then
    alter table public."ProjectNeed"
      add constraint project_need_required_count_positive
      check ("requiredCount" is null or "requiredCount" >= 1);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_need_application_required_count_positive'
  ) then
    alter table public."ProjectNeedApplication"
      add constraint project_need_application_required_count_positive
      check ("proposedRequiredCount" is null or "proposedRequiredCount" >= 1);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_need_application_equity_percent_range'
  ) then
    alter table public."ProjectNeedApplication"
      add constraint project_need_application_equity_percent_range
      check (
        "proposedEquityPercent" is null
        or ("proposedEquityPercent" >= 0 and "proposedEquityPercent" <= 100)
      );
  end if;
end $$;

create index if not exists "ProjectNeedApplication_projectId_status_createdAt_idx"
  on public."ProjectNeedApplication" ("projectId", "status", "createdAt");
create index if not exists "ProjectNeedApplication_projectNeedId_status_createdAt_idx"
  on public."ProjectNeedApplication" ("projectNeedId", "status", "createdAt");
create index if not exists "ProjectNeedApplication_applicantUserId_status_createdAt_idx"
  on public."ProjectNeedApplication" ("applicantUserId", "status", "createdAt");
create index if not exists "ProjectNeedApplication_ownerUserId_status_createdAt_idx"
  on public."ProjectNeedApplication" ("ownerUserId", "status", "createdAt");
create index if not exists "ProjectMember_userId_status_idx"
  on public."ProjectMember" ("userId", "status");

create or replace function public.set_project_need_application_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create or replace function public.set_project_member_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'project_need_application_set_updated_at'
  ) then
    create trigger project_need_application_set_updated_at
    before update on public."ProjectNeedApplication"
    for each row execute procedure public.set_project_need_application_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'project_member_set_updated_at'
  ) then
    create trigger project_member_set_updated_at
    before update on public."ProjectMember"
    for each row execute procedure public.set_project_member_updated_at();
  end if;
end $$;

alter table public."ProjectNeedApplication" enable row level security;
alter table public."ProjectMember" enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('ProjectNeedApplication')
      and policyname = 'project_need_application_select_own_or_owner'
  ) then
    create policy "project_need_application_select_own_or_owner"
      on public."ProjectNeedApplication"
      for select
      to authenticated
      using (
        auth.uid()::text = "applicantUserId"
        or auth.uid()::text = "ownerUserId"
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('ProjectNeedApplication')
      and policyname = 'project_need_application_insert_by_applicant'
  ) then
    create policy "project_need_application_insert_by_applicant"
      on public."ProjectNeedApplication"
      for insert
      to authenticated
      with check (auth.uid()::text = "applicantUserId");
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('ProjectNeedApplication')
      and policyname = 'project_need_application_update_owner_or_applicant'
  ) then
    create policy "project_need_application_update_owner_or_applicant"
      on public."ProjectNeedApplication"
      for update
      to authenticated
      using (auth.uid()::text = "ownerUserId" or auth.uid()::text = "applicantUserId")
      with check (auth.uid()::text = "ownerUserId" or auth.uid()::text = "applicantUserId");
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('ProjectMember')
      and policyname = 'project_member_select_related_users'
  ) then
    create policy "project_member_select_related_users"
      on public."ProjectMember"
      for select
      to authenticated
      using (
        auth.uid()::text = "userId"
        or exists (
          select 1
          from public."Project" p
          where p."id" = "projectId"
            and p."ownerId" = auth.uid()::text
        )
      );
  end if;
end $$;
