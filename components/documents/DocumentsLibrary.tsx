"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_FILE_TYPES,
  DOCUMENT_LEVELS,
  DOCUMENT_OBJECTIVES,
  DOCUMENT_SECTORS,
  type DocumentCategory,
  type DocumentTemplate,
  type DocumentFileType,
  type DocumentLevel,
  type DocumentObjective,
  type DocumentSector,
} from "@/src/lib/document-templates";

type UsageMode = "download" | "interactive";

const ALL_FILTER_VALUE = "__all__";

function buildInteractiveLink(templateSlug: string) {
  const dashboardPath = `/dashboard/projects/new?template=${encodeURIComponent(templateSlug)}`;
  return dashboardPath;
}

function buildLoginRedirect(templateSlug: string) {
  const nextPath = buildInteractiveLink(templateSlug);
  return `/auth/login?next=${encodeURIComponent(nextPath)}`;
}

function categoryTone(category: DocumentCategory) {
  if (category === "Business & Strategie") {
    return "bg-indigo-100 text-indigo-700";
  }
  if (category === "Juridique & Creation") {
    return "bg-sky-100 text-sky-700";
  }
  if (category === "Finance & Investissement") {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-amber-100 text-amber-700";
}

type DocumentsLibraryProps = {
  isAuthenticated: boolean;
  templates: DocumentTemplate[];
};

export function DocumentsLibrary({ isAuthenticated, templates }: DocumentsLibraryProps) {
  const [usageMode, setUsageMode] = useState<UsageMode>("download");
  const [sector, setSector] = useState<DocumentSector | typeof ALL_FILTER_VALUE>(
    ALL_FILTER_VALUE
  );
  const [level, setLevel] = useState<DocumentLevel | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [fileType, setFileType] = useState<DocumentFileType | typeof ALL_FILTER_VALUE>(
    ALL_FILTER_VALUE
  );
  const [objective, setObjective] = useState<DocumentObjective | typeof ALL_FILTER_VALUE>(
    ALL_FILTER_VALUE
  );
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return templates.filter((template) => {
      if (sector !== ALL_FILTER_VALUE && !template.sectorTags.includes(sector)) {
        return false;
      }
      if (level !== ALL_FILTER_VALUE && template.level !== level) {
        return false;
      }
      if (fileType !== ALL_FILTER_VALUE && template.fileType !== fileType) {
        return false;
      }
      if (objective !== ALL_FILTER_VALUE && template.objective !== objective) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        template.title,
        template.summary,
        template.highlight,
        template.category,
        template.objective,
        template.sectorTags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [fileType, level, objective, search, sector, templates]);

  const groupedTemplates = useMemo(() => {
    return DOCUMENT_CATEGORIES.map((category) => ({
      category,
      items: filteredTemplates.filter((template) => template.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filteredTemplates]);

  const clearFilters = () => {
    setSector(ALL_FILTER_VALUE);
    setLevel(ALL_FILTER_VALUE);
    setFileType(ALL_FILTER_VALUE);
    setObjective(ALL_FILTER_VALUE);
    setSearch("");
  };

  return (
    <section className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm font-semibold text-text-primary">Mode A - Telechargement simple</p>
          <p className="mt-2 text-sm text-text-secondary">
            Telechargez un modele editable, adaptez-le a votre contexte, puis reutilisez-le.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <p className="text-sm font-semibold text-text-primary">Mode B - Mode interactif</p>
          <p className="mt-2 text-sm text-text-secondary">
            Utilisez un modele depuis votre compte pour preparer un brouillon de projet dans le
            dashboard.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Filtres intelligents</p>
            <p className="mt-1 text-sm text-text-secondary">
              Combinez secteur, niveau, type de fichier et objectif.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => setUsageMode("download")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                usageMode === "download"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Telechargement
            </button>
            <button
              type="button"
              onClick={() => setUsageMode("interactive")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                usageMode === "interactive"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Interactif
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 text-xs text-text-secondary">
            <span>Secteur</span>
            <select
              value={sector}
              onChange={(event) =>
                setSector(event.target.value as DocumentSector | typeof ALL_FILTER_VALUE)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value={ALL_FILTER_VALUE}>Tous les secteurs</option>
              {DOCUMENT_SECTORS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-text-secondary">
            <span>Niveau</span>
            <select
              value={level}
              onChange={(event) =>
                setLevel(event.target.value as DocumentLevel | typeof ALL_FILTER_VALUE)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value={ALL_FILTER_VALUE}>Tous les niveaux</option>
              {DOCUMENT_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-text-secondary">
            <span>Type</span>
            <select
              value={fileType}
              onChange={(event) =>
                setFileType(event.target.value as DocumentFileType | typeof ALL_FILTER_VALUE)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value={ALL_FILTER_VALUE}>Tous les types</option>
              {DOCUMENT_FILE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-text-secondary">
            <span>Objectif</span>
            <select
              value={objective}
              onChange={(event) =>
                setObjective(event.target.value as DocumentObjective | typeof ALL_FILTER_VALUE)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value={ALL_FILTER_VALUE}>Tous les objectifs</option>
              {DOCUMENT_OBJECTIVES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-text-secondary">
            <span>Recherche</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="business plan, statuts..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{filteredTemplates.length}</span>{" "}
            modele(s) disponibles
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Reinitialiser les filtres
          </button>
        </div>
      </div>

      {groupedTemplates.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-soft">
          <p className="text-base font-semibold text-text-primary">Aucun modele trouve</p>
          <p className="mt-2 text-sm text-text-secondary">
            Ajustez les filtres ou la recherche pour afficher plus de resultats.
          </p>
        </div>
      ) : (
        groupedTemplates.map((group) => (
          <section key={group.category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">{group.category}</h2>
              <p className="text-sm text-text-secondary">{group.items.length} modele(s)</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((template) => {
                const interactiveLink = buildInteractiveLink(template.slug);
                const interactiveLoginLink = buildLoginRedirect(template.slug);
                const downloadHref = `/api/document-templates/${template.slug}`;
                const primaryHref =
                  usageMode === "interactive"
                    ? isAuthenticated
                      ? interactiveLink
                      : interactiveLoginLink
                    : downloadHref;
                const primaryLabel =
                  usageMode === "interactive"
                    ? isAuthenticated
                      ? "Utiliser ce modele"
                      : "Se connecter pour utiliser"
                    : "Telecharger le modele";
                const secondaryHref =
                  usageMode === "interactive"
                    ? downloadHref
                    : isAuthenticated
                      ? interactiveLink
                      : interactiveLoginLink;
                const secondaryLabel =
                  usageMode === "interactive"
                    ? "Telecharger le modele"
                    : isAuthenticated
                      ? "Utiliser ce modele"
                      : "Se connecter pour utiliser";

                return (
                  <article
                    key={template.slug}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1",
                          categoryTone(template.category)
                        )}
                      >
                        {template.category}
                      </span>
                      <span className="rounded-full bg-surface-accent px-2.5 py-1 text-text-secondary">
                        {template.level}
                      </span>
                      <span className="rounded-full bg-surface-accent px-2.5 py-1 text-text-secondary">
                        {template.fileType}
                      </span>
                      <span className="rounded-full bg-surface-accent px-2.5 py-1 text-text-secondary">
                        {template.objective}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-text-primary">{template.title}</h3>
                    <p className="mt-2 text-sm text-text-secondary">{template.summary}</p>
                    <p className="mt-3 text-sm text-text-primary">{template.highlight}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.sectorTags.map((tag) => (
                        <span
                          key={`${template.slug}-${tag}`}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={primaryHref}
                        className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
                        prefetch={false}
                      >
                        {primaryLabel}
                      </Link>
                      <Link
                        href={secondaryHref}
                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                        prefetch={false}
                      >
                        {secondaryLabel}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </section>
  );
}

export default DocumentsLibrary;
