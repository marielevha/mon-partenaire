-- Document templates catalog for public library + user-created templates.
-- Safe to re-run.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'DocumentTemplateCategory' and n.nspname = 'public'
  ) then
    create type public."DocumentTemplateCategory" as enum (
      'BUSINESS_STRATEGY',
      'LEGAL_CREATION',
      'FINANCE_INVESTMENT',
      'LOCAL_SECTORS'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'DocumentTemplateLevel' and n.nspname = 'public'
  ) then
    create type public."DocumentTemplateLevel" as enum (
      'BEGINNER',
      'ADVANCED'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'DocumentTemplateFileType' and n.nspname = 'public'
  ) then
    create type public."DocumentTemplateFileType" as enum (
      'PDF',
      'DOCX',
      'EDITABLE_ONLINE'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'DocumentTemplateObjective' and n.nspname = 'public'
  ) then
    create type public."DocumentTemplateObjective" as enum (
      'CREATE_BUSINESS',
      'RAISE_FUNDS',
      'FORMALIZE_PARTNERSHIP'
    );
  end if;
end $$;

create table if not exists public."DocumentTemplate" (
  "id" uuid primary key default gen_random_uuid(),
  "ownerId" text null,
  "slug" text not null unique,
  "title" text not null,
  "summary" text not null,
  "category" public."DocumentTemplateCategory" not null,
  "level" public."DocumentTemplateLevel" not null,
  "fileType" public."DocumentTemplateFileType" not null,
  "objective" public."DocumentTemplateObjective" not null,
  "sectorTags" text[] not null default array[]::text[],
  "highlight" text not null,
  "attachedDocumentPath" text null,
  "attachedDocumentName" text null,
  "attachedDocumentMimeType" text null,
  "attachedDocumentSizeBytes" integer null,
  "isPublished" boolean not null default true,
  "isFeatured" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public."DocumentTemplate"
  add column if not exists "attachedDocumentPath" text null,
  add column if not exists "attachedDocumentName" text null,
  add column if not exists "attachedDocumentMimeType" text null,
  add column if not exists "attachedDocumentSizeBytes" integer null;

create index if not exists "DocumentTemplate_isPublished_isFeatured_idx"
  on public."DocumentTemplate" ("isPublished", "isFeatured");
create index if not exists "DocumentTemplate_category_idx"
  on public."DocumentTemplate" ("category");
create index if not exists "DocumentTemplate_ownerId_idx"
  on public."DocumentTemplate" ("ownerId");

alter table public."DocumentTemplate" enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('DocumentTemplate')
      and policyname = 'public_read_published_document_templates'
  ) then
    create policy "public_read_published_document_templates"
      on public."DocumentTemplate"
      for select
      to anon
      using ("isPublished" = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('DocumentTemplate')
      and policyname = 'authenticated_read_document_templates'
  ) then
    create policy "authenticated_read_document_templates"
      on public."DocumentTemplate"
      for select
      to authenticated
      using ("isPublished" = true or "ownerId" = auth.uid()::text);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('DocumentTemplate')
      and policyname = 'authenticated_insert_document_templates'
  ) then
    create policy "authenticated_insert_document_templates"
      on public."DocumentTemplate"
      for insert
      to authenticated
      with check ("ownerId" = auth.uid()::text);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('DocumentTemplate')
      and policyname = 'authenticated_update_document_templates'
  ) then
    create policy "authenticated_update_document_templates"
      on public."DocumentTemplate"
      for update
      to authenticated
      using ("ownerId" = auth.uid()::text)
      with check ("ownerId" = auth.uid()::text);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and lower(tablename) = lower('DocumentTemplate')
      and policyname = 'authenticated_delete_document_templates'
  ) then
    create policy "authenticated_delete_document_templates"
      on public."DocumentTemplate"
      for delete
      to authenticated
      using ("ownerId" = auth.uid()::text);
  end if;
end $$;

insert into public."DocumentTemplate" (
  "ownerId",
  "slug",
  "title",
  "summary",
  "category",
  "level",
  "fileType",
  "objective",
  "sectorTags",
  "highlight",
  "isPublished",
  "isFeatured"
)
values
  (null, 'business-plan-complet', 'Business plan complet', 'Plan complet pour lancer et structurer votre projet.', 'BUSINESS_STRATEGY', 'BEGINNER', 'DOCX', 'CREATE_BUSINESS', array['Tous secteurs'], 'Inclut resume, marche, operations et projection financiere.', true, true),
  (null, 'business-model-canvas', 'Business Model Canvas', 'Modele simple pour clarifier proposition de valeur et revenus.', 'BUSINESS_STRATEGY', 'BEGINNER', 'EDITABLE_ONLINE', 'CREATE_BUSINESS', array['Tous secteurs', 'Services', 'Commerce'], 'Parfait pour aligner equipe et associes au demarrage.', true, true),
  (null, 'etude-marche-simplifiee', 'Etude de marche simplifiee', 'Cadre rapide pour valider demande, clients et concurrence locale.', 'BUSINESS_STRATEGY', 'BEGINNER', 'PDF', 'CREATE_BUSINESS', array['Tous secteurs', 'Commerce'], 'Focus terrain avec check-list actionnable.', true, false),
  (null, 'plan-financier-previsionnel-3-ans', 'Plan financier previsionnel (3 ans)', 'Hypotheses de ventes, charges et besoin de financement.', 'BUSINESS_STRATEGY', 'ADVANCED', 'EDITABLE_ONLINE', 'RAISE_FUNDS', array['Tous secteurs', 'Finance'], 'Structure attendue par banques et investisseurs.', true, true),
  (null, 'executive-summary', 'Executive summary', 'Synthese professionnelle pour presenter le projet en 2 pages.', 'BUSINESS_STRATEGY', 'BEGINNER', 'DOCX', 'RAISE_FUNDS', array['Tous secteurs'], 'Ideale pour vos premiers rendez-vous de financement.', true, false),

  (null, 'statuts-sarl-congo', 'Modele de statuts SARL (adapte Congo)', 'Base de statuts pour formaliser une SARL en contexte local.', 'LEGAL_CREATION', 'ADVANCED', 'DOCX', 'FORMALIZE_PARTNERSHIP', array['Juridique', 'Tous secteurs'], 'Inclut clauses clefs de gouvernance et repartition des roles.', true, true),
  (null, 'pacte-associes', 'Pacte d''associes', 'Regles de decision, sortie et protection entre associes.', 'LEGAL_CREATION', 'ADVANCED', 'DOCX', 'FORMALIZE_PARTNERSHIP', array['Juridique', 'Tous secteurs'], 'Reduit les conflits et clarifie la collaboration.', true, true),
  (null, 'proces-verbal-assemblee-constitutive', 'Proces-verbal d''assemblee constitutive', 'Document de reference pour la creation officielle de societe.', 'LEGAL_CREATION', 'BEGINNER', 'DOCX', 'FORMALIZE_PARTNERSHIP', array['Juridique', 'Tous secteurs'], 'Format utilisable pour demarches administratives.', true, false),
  (null, 'contrat-entre-associes', 'Modele de contrat entre associes', 'Cadre contractuel pour engagements et obligations mutuelles.', 'LEGAL_CREATION', 'BEGINNER', 'DOCX', 'FORMALIZE_PARTNERSHIP', array['Juridique', 'Tous secteurs'], 'Version concise et facile a adapter.', true, false),
  (null, 'contrat-partenariat', 'Contrat de partenariat', 'Accord type pour partenariat commercial ou operationnel.', 'LEGAL_CREATION', 'BEGINNER', 'DOCX', 'FORMALIZE_PARTNERSHIP', array['Juridique', 'Commerce', 'Services'], 'Definit objectifs, duree, responsabilites et clauses de sortie.', true, false),

  (null, 'term-sheet-simple', 'Term sheet simple', 'Points essentiels d''un accord d''investissement.', 'FINANCE_INVESTMENT', 'ADVANCED', 'DOCX', 'RAISE_FUNDS', array['Finance', 'Tous secteurs'], 'Structure lisible pour aligner rapidement fondateurs et investisseurs.', true, true),
  (null, 'convention-apport-capital', 'Convention d''apport en capital', 'Documente l''apport financier et les conditions associees.', 'FINANCE_INVESTMENT', 'ADVANCED', 'DOCX', 'RAISE_FUNDS', array['Finance', 'Tous secteurs'], 'Traite montant, calendrier de versement et contreparties.', true, false),
  (null, 'tableau-repartition-parts', 'Tableau de repartition des parts', 'Vision claire de la cap table entre associes et investisseurs.', 'FINANCE_INVESTMENT', 'BEGINNER', 'EDITABLE_ONLINE', 'RAISE_FUNDS', array['Finance', 'Tous secteurs'], 'Utile avant chaque discussion de levee ou d''entree d''un associe.', true, true),
  (null, 'plan-tresorerie', 'Plan de tresorerie', 'Suivi mensuel des entrees/sorties pour piloter la liquidite.', 'FINANCE_INVESTMENT', 'BEGINNER', 'EDITABLE_ONLINE', 'CREATE_BUSINESS', array['Finance', 'Tous secteurs'], 'Aide a anticiper les tensions de cash.', true, false),
  (null, 'demande-financement', 'Modele de demande de financement', 'Trame prete a envoyer aux partenaires financiers.', 'FINANCE_INVESTMENT', 'BEGINNER', 'DOCX', 'RAISE_FUNDS', array['Finance', 'Tous secteurs'], 'Resume besoins, garanties et plan de remboursement.', true, false),

  (null, 'business-plan-pisciculture', 'Business plan pisciculture', 'Modele operationnel adapte aux projets d''elevage de poissons.', 'LOCAL_SECTORS', 'BEGINNER', 'DOCX', 'CREATE_BUSINESS', array['Pisciculture', 'Agribusiness'], 'Inclut cycle de production, cout alimentation et vente locale.', true, true),
  (null, 'business-plan-elevage-poulet', 'Business plan elevage poulet', 'Trame terrain pour elevage avicole en cycle court.', 'LOCAL_SECTORS', 'BEGINNER', 'DOCX', 'CREATE_BUSINESS', array['Elevage avicole', 'Agribusiness'], 'Dimensionnement, mortalite cible et marge par lot.', true, true),
  (null, 'business-plan-transformation-manioc', 'Business plan transformation manioc', 'Modele pour activites de transformation agroalimentaire locale.', 'LOCAL_SECTORS', 'BEGINNER', 'DOCX', 'CREATE_BUSINESS', array['Transformation agro', 'Agribusiness'], 'Approche orientee production, emballage et distribution locale.', true, true),
  (null, 'business-plan-ecommerce-local', 'Business plan e-commerce local', 'Plan pour boutique en ligne avec logistique de proximite.', 'LOCAL_SECTORS', 'BEGINNER', 'EDITABLE_ONLINE', 'CREATE_BUSINESS', array['E-commerce', 'Commerce'], 'Inclut acquisition clients, livraison et service client.', true, true),
  (null, 'business-plan-transport-urbain', 'Business plan transport urbain', 'Trame pour service de transport local ou navette urbaine.', 'LOCAL_SECTORS', 'ADVANCED', 'DOCX', 'CREATE_BUSINESS', array['Transport urbain', 'Services'], 'Modelise flotte, remplissage, carburant et maintenance.', true, true)
on conflict ("slug") do update
set
  "title" = excluded."title",
  "summary" = excluded."summary",
  "category" = excluded."category",
  "level" = excluded."level",
  "fileType" = excluded."fileType",
  "objective" = excluded."objective",
  "sectorTags" = excluded."sectorTags",
  "highlight" = excluded."highlight",
  "isPublished" = excluded."isPublished",
  "isFeatured" = excluded."isFeatured",
  "updatedAt" = now();
