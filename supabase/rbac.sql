-- RBAC (roles + permissions) setup for Mon Partenaire.
-- Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public."Role" (
  "id" uuid primary key default gen_random_uuid(),
  "code" text not null unique,
  "name" text not null,
  "description" text null,
  "isSystem" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."Permission" (
  "id" uuid primary key default gen_random_uuid(),
  "code" text not null unique,
  "resource" text not null,
  "action" text not null,
  "description" text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."RolePermission" (
  "id" uuid primary key default gen_random_uuid(),
  "roleId" uuid not null references public."Role"("id") on delete cascade,
  "permissionId" uuid not null references public."Permission"("id") on delete cascade,
  "createdAt" timestamptz not null default now(),
  unique ("roleId", "permissionId")
);

create table if not exists public."UserRole" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references auth.users("id") on delete cascade,
  "roleId" uuid not null references public."Role"("id") on delete cascade,
  "assignedByUserId" uuid null references auth.users("id") on delete set null,
  "createdAt" timestamptz not null default now(),
  unique ("userId", "roleId")
);

create index if not exists "Permission_resource_action_idx"
  on public."Permission" ("resource", "action");

create index if not exists "RolePermission_permissionId_idx"
  on public."RolePermission" ("permissionId");

create index if not exists "UserRole_userId_idx"
  on public."UserRole" ("userId");

create index if not exists "UserRole_roleId_idx"
  on public."UserRole" ("roleId");

create or replace function public.set_updated_at_timestamp()
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
    where tgname = 'set_role_updated_at'
  ) then
    create trigger set_role_updated_at
    before update on public."Role"
    for each row execute procedure public.set_updated_at_timestamp();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_permission_updated_at'
  ) then
    create trigger set_permission_updated_at
    before update on public."Permission"
    for each row execute procedure public.set_updated_at_timestamp();
  end if;
end $$;

create or replace function public.user_has_permission(target_user_id uuid, target_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."UserRole" ur
    join public."RolePermission" rp on rp."roleId" = ur."roleId"
    join public."Permission" p on p."id" = rp."permissionId"
    where ur."userId" = target_user_id
      and p."code" = target_permission_code
  );
$$;

create or replace function public.user_has_role(target_user_id uuid, target_role_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."UserRole" ur
    join public."Role" r on r."id" = ur."roleId"
    where ur."userId" = target_user_id
      and r."code" = target_role_code
  );
$$;

revoke all on function public.user_has_permission(uuid, text) from public;
revoke all on function public.user_has_role(uuid, text) from public;

grant execute on function public.user_has_permission(uuid, text) to authenticated;
grant execute on function public.user_has_role(uuid, text) to authenticated;

alter table public."Role" enable row level security;
alter table public."Permission" enable row level security;
alter table public."RolePermission" enable row level security;
alter table public."UserRole" enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('Role')
      and policyname = 'authenticated_read_roles'
  ) then
    create policy "authenticated_read_roles"
      on public."Role"
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('Role')
      and policyname = 'manage_roles_with_permission'
  ) then
    create policy "manage_roles_with_permission"
      on public."Role"
      for all
      to authenticated
      using (public.user_has_permission(auth.uid(), 'rbac.roles.manage'))
      with check (public.user_has_permission(auth.uid(), 'rbac.roles.manage'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('Permission')
      and policyname = 'authenticated_read_permissions'
  ) then
    create policy "authenticated_read_permissions"
      on public."Permission"
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('Permission')
      and policyname = 'manage_permissions_with_permission'
  ) then
    create policy "manage_permissions_with_permission"
      on public."Permission"
      for all
      to authenticated
      using (public.user_has_permission(auth.uid(), 'rbac.roles.manage'))
      with check (public.user_has_permission(auth.uid(), 'rbac.roles.manage'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('RolePermission')
      and policyname = 'authenticated_read_role_permissions'
  ) then
    create policy "authenticated_read_role_permissions"
      on public."RolePermission"
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('RolePermission')
      and policyname = 'manage_role_permissions_with_permission'
  ) then
    create policy "manage_role_permissions_with_permission"
      on public."RolePermission"
      for all
      to authenticated
      using (public.user_has_permission(auth.uid(), 'rbac.roles.manage'))
      with check (public.user_has_permission(auth.uid(), 'rbac.roles.manage'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('UserRole')
      and policyname = 'read_own_or_authorized_user_roles'
  ) then
    create policy "read_own_or_authorized_user_roles"
      on public."UserRole"
      for select
      to authenticated
      using (
        auth.uid() = "userId"
        or public.user_has_permission(auth.uid(), 'rbac.user_roles.read')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('UserRole')
      and policyname = 'manage_user_roles_with_permission'
  ) then
    create policy "manage_user_roles_with_permission"
      on public."UserRole"
      for all
      to authenticated
      using (public.user_has_permission(auth.uid(), 'rbac.user_roles.manage'))
      with check (public.user_has_permission(auth.uid(), 'rbac.user_roles.manage'));
  end if;
end $$;

insert into public."Role" ("code", "name", "description", "isSystem")
values
  ('member', 'Membre', 'Utilisateur standard de la plateforme.', true),
  ('operator', 'Opérateur', 'Pilotage opérationnel et qualité.', true),
  ('admin', 'Administrateur', 'Administration fonctionnelle de la plateforme.', true),
  ('super_admin', 'Super administrateur', 'Accès complet RBAC et administration.', true)
on conflict ("code") do update
set
  "name" = excluded."name",
  "description" = excluded."description",
  "isSystem" = excluded."isSystem",
  "updatedAt" = now();

insert into public."Permission" ("code", "resource", "action", "description")
values
  ('dashboard.access', 'dashboard', 'access', 'Accéder au dashboard'),
  ('dashboard.overview.read', 'dashboard.overview', 'read', 'Voir la vue d''ensemble dashboard'),
  ('dashboard.projects.read', 'dashboard.projects', 'read', 'Voir la liste des projets'),
  ('dashboard.projects.create', 'dashboard.projects', 'create', 'Créer un projet'),
  ('dashboard.projects.update.own', 'dashboard.projects', 'update-own', 'Modifier ses projets'),
  ('dashboard.projects.update.any', 'dashboard.projects', 'update-any', 'Modifier tous les projets'),
  ('dashboard.document_templates.read', 'dashboard.document-templates', 'read', 'Voir les templates documents'),
  ('dashboard.document_templates.create', 'dashboard.document-templates', 'create', 'Créer un template document'),
  ('dashboard.document_templates.update.own', 'dashboard.document-templates', 'update-own', 'Modifier ses templates document'),
  ('dashboard.document_templates.update.any', 'dashboard.document-templates', 'update-any', 'Modifier tous les templates document'),
  ('dashboard.profile.read', 'dashboard.profile', 'read', 'Voir son profil dashboard'),
  ('dashboard.profile.update.own', 'dashboard.profile', 'update-own', 'Modifier son profil dashboard'),
  ('dashboard.notifications.read', 'dashboard.notifications', 'read', 'Voir ses notifications dashboard'),
  ('dashboard.notifications.manage.own', 'dashboard.notifications', 'manage-own', 'Gérer ses notifications dashboard'),
  ('dashboard.pilotage.read', 'dashboard.pilotage', 'read', 'Voir la page pilotage'),
  ('dashboard.quality.read', 'dashboard.quality', 'read', 'Voir les incohérences projet'),
  ('dashboard.quality.notify', 'dashboard.quality', 'notify', 'Notifier un propriétaire de projet incohérent'),
  ('dashboard.logs.read', 'dashboard.logs', 'read', 'Voir la page des logs'),
  ('rbac.roles.read', 'rbac.roles', 'read', 'Lire les rôles RBAC'),
  ('rbac.roles.manage', 'rbac.roles', 'manage', 'Créer/mettre à jour les rôles/permissions RBAC'),
  ('rbac.user_roles.read', 'rbac.user-roles', 'read', 'Lire les assignations de rôles utilisateurs'),
  ('rbac.user_roles.manage', 'rbac.user-roles', 'manage', 'Gérer les assignations de rôles utilisateurs')
on conflict ("code") do update
set
  "resource" = excluded."resource",
  "action" = excluded."action",
  "description" = excluded."description",
  "updatedAt" = now();

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
cross join public."Permission" p
where r."code" = 'super_admin'
on conflict ("roleId", "permissionId") do nothing;

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p
  on p."code" = any(array[
    'dashboard.access',
    'dashboard.overview.read',
    'dashboard.projects.read',
    'dashboard.projects.create',
    'dashboard.projects.update.own',
    'dashboard.projects.update.any',
    'dashboard.document_templates.read',
    'dashboard.document_templates.create',
    'dashboard.document_templates.update.own',
    'dashboard.document_templates.update.any',
    'dashboard.profile.read',
    'dashboard.profile.update.own',
    'dashboard.notifications.read',
    'dashboard.notifications.manage.own',
    'dashboard.pilotage.read',
    'dashboard.quality.read',
    'dashboard.quality.notify',
    'dashboard.logs.read',
    'rbac.roles.read',
    'rbac.user_roles.read'
  ])
where r."code" = 'admin'
on conflict ("roleId", "permissionId") do nothing;

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p
  on p."code" = any(array[
    'dashboard.access',
    'dashboard.overview.read',
    'dashboard.projects.read',
    'dashboard.projects.create',
    'dashboard.projects.update.own',
    'dashboard.document_templates.read',
    'dashboard.document_templates.create',
    'dashboard.document_templates.update.own',
    'dashboard.profile.read',
    'dashboard.profile.update.own',
    'dashboard.notifications.read',
    'dashboard.notifications.manage.own',
    'dashboard.pilotage.read',
    'dashboard.quality.read',
    'dashboard.quality.notify'
  ])
where r."code" = 'operator'
on conflict ("roleId", "permissionId") do nothing;

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p
  on p."code" = any(array[
    'dashboard.access',
    'dashboard.overview.read',
    'dashboard.projects.read',
    'dashboard.projects.create',
    'dashboard.projects.update.own',
    'dashboard.document_templates.read',
    'dashboard.document_templates.create',
    'dashboard.document_templates.update.own',
    'dashboard.profile.read',
    'dashboard.profile.update.own',
    'dashboard.notifications.read',
    'dashboard.notifications.manage.own'
  ])
where r."code" = 'member'
on conflict ("roleId", "permissionId") do nothing;

insert into public."UserRole" ("userId", "roleId")
select u."id", r."id"
from auth.users u
join public."Role" r on r."code" = 'member'
left join public."UserRole" ur
  on ur."userId" = u."id"
 and ur."roleId" = r."id"
where ur."id" is null;

create or replace function public.assign_default_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_role_id uuid;
begin
  select "id"
  into member_role_id
  from public."Role"
  where "code" = 'member'
  limit 1;

  if member_role_id is null then
    return new;
  end if;

  insert into public."UserRole" ("userId", "roleId")
  values (new."id", member_role_id)
  on conflict ("userId", "roleId") do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created_assign_default_role'
  ) then
    create trigger on_auth_user_created_assign_default_role
    after insert on auth.users
    for each row
    execute procedure public.assign_default_member_role();
  end if;
end $$;
