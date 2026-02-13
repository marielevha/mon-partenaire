-- Upgrade Project to track founder social share percentage (idempotent).
-- Safe to run multiple times.

alter table public."Project"
  add column if not exists "ownerEquityPercent" integer null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_owner_equity_percent_range'
  ) then
    alter table public."Project"
      add constraint project_owner_equity_percent_range
      check ("ownerEquityPercent" is null or ("ownerEquityPercent" >= 0 and "ownerEquityPercent" <= 100));
  end if;
end $$;

