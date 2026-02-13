-- Upgrade ProjectNeed to support structured need management (idempotent).
-- Safe to run multiple times.

alter table public."ProjectNeed"
  add column if not exists "requiredCount" integer null;

-- Optional hardening: keep valid positive values only when present.
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

