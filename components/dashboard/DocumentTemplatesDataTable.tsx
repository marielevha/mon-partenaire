"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type TemplateDataTableItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
type SortField = "updatedAt" | "createdAt" | "title";
type SortDirection = "asc" | "desc";

const categoryLabels: Record<string, string> = {
  BUSINESS_STRATEGY: "Business & Strategie",
  LEGAL_CREATION: "Juridique & Creation",
  FINANCE_INVESTMENT: "Finance & Investissement",
  LOCAL_SECTORS: "Secteurs congolais",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Debutant",
  ADVANCED: "Avance",
};

const fileTypeLabels: Record<string, string> = {
  PDF: "PDF",
  DOCX: "DOCX",
  EDITABLE_ONLINE: "Editable online",
};

const objectiveLabels: Record<string, string> = {
  CREATE_BUSINESS: "Creer entreprise",
  RAISE_FUNDS: "Lever des fonds",
  FORMALIZE_PARTNERSHIP: "Formaliser partenariat",
};

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseDateToTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

type DocumentTemplatesDataTableProps = {
  templates: TemplateDataTableItem[];
};

export function DocumentTemplatesDataTable({ templates }: DocumentTemplatesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDataTableItem | null>(
    null
  );

  const publishedCount = useMemo(
    () => templates.filter((template) => template.isPublished).length,
    [templates]
  );
  const featuredCount = useMemo(
    () => templates.filter((template) => template.isFeatured).length,
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return templates;
    }

    return templates.filter((template) => {
      const searchable = [template.title, template.summary, template.slug]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [searchQuery, templates]);

  const sortedTemplates = useMemo(() => {
    const items = [...filteredTemplates];

    items.sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
      } else if (sortField === "createdAt") {
        comparison = parseDateToTime(a.createdAt) - parseDateToTime(b.createdAt);
      } else {
        comparison = parseDateToTime(a.updatedAt) - parseDateToTime(b.updatedAt);
      }

      if (comparison === 0) {
        comparison = a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [filteredTemplates, sortDirection, sortField]);

  const totalItems = sortedTemplates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTemplates = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * itemsPerPage;
    return sortedTemplates.slice(start, start + itemsPerPage);
  }, [effectiveCurrentPage, itemsPerPage, sortedTemplates]);

  const visiblePageCount = 5;
  let startPage = Math.max(1, effectiveCurrentPage - Math.floor(visiblePageCount / 2));
  const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
  if (endPage - startPage + 1 < visiblePageCount) {
    startPage = Math.max(1, endPage - visiblePageCount + 1);
  }
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((previousDirection) =>
        previousDirection === "desc" ? "asc" : "desc"
      );
      setCurrentPage(1);
      return;
    }
    setSortField(field);
    setSortDirection("desc");
    setCurrentPage(1);
  };

  const closeDetailsModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Templates</p>
          <p className="mt-2 text-2xl font-semibold">{templates.length}</p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Publiés</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {publishedCount}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Mis en avant</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
            {featuredCount}
          </p>
        </div>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex flex-wrap items-center gap-2">
            <span className="dashboard-faint text-sm">Recherche</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par titre, résumé ou slug..."
              className="dashboard-input w-full min-w-0 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 sm:w-[320px]"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="dashboard-faint text-sm">Lignes</span>
            <select
              value={String(itemsPerPage)}
              onChange={(event) => {
                setItemsPerPage(Number.parseInt(event.target.value, 10));
                setCurrentPage(1);
              }}
              className="dashboard-input rounded-md px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {paginatedTemplates.length === 0 ? (
          <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
            Aucun template trouvé pour ces critères.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="dashboard-panel-soft">
                <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("title")}
                      className="transition-colors hover:text-accent"
                    >
                      Template
                    </button>
                  </th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Niveau</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("updatedAt")}
                      className="transition-colors hover:text-accent"
                    >
                      Mise à jour
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="dashboard-divider border-b border-border/50 align-top transition-colors hover:bg-accent/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{template.title}</p>
                      <p className="dashboard-faint mt-1 line-clamp-2 max-w-sm text-xs">
                        {template.summary}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {categoryLabels[template.category] ?? template.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {levelLabels[template.level] ?? template.level}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                          template.isPublished
                            ? "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200"
                            : "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200"
                        }`}
                      >
                        {template.isPublished ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p>{formatDate(template.updatedAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/document-templates/${template.id}/edit`}
                          title="Modifier"
                          aria-label="Modifier"
                          className="dashboard-icon-btn inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="m14.5 4.5 1 1a1.4 1.4 0 0 1 0 2l-7.6 7.6L5 16l.9-2.9L13.5 5.5a1.4 1.4 0 0 1 2 0Z" />
                            <path d="M4 16h12" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          title="Supprimer (bientôt disponible)"
                          aria-label="Supprimer"
                          disabled
                          className="dashboard-icon-btn inline-flex h-8 w-8 items-center justify-center rounded-md opacity-45"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M3.5 5.5h13" />
                            <path d="M8 3.5h4" />
                            <path d="M6 5.5v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-10" />
                            <path d="M8.5 8.5v5" />
                            <path d="M11.5 8.5v5" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTemplate(template)}
                          title="Voir les détails"
                          aria-label="Voir les détails"
                          className="dashboard-icon-btn inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M2.5 10S5.5 5 10 5s7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5Z" />
                            <circle cx="10" cy="10" r="2.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginatedTemplates.length > 0 ? (
          <div className="dashboard-divider mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="dashboard-faint text-sm">
              Page {effectiveCurrentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={effectiveCurrentPage === 1}
                className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                Précédent
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    page === effectiveCurrentPage
                      ? "dashboard-btn-primary"
                      : "dashboard-btn-secondary transition-colors"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={effectiveCurrentPage === totalPages}
                className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        ) : null}

        <p className="dashboard-faint mt-3 text-xs">
          {totalItems} résultat(s) filtré(s)
        </p>
      </div>

      {selectedTemplate ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Détails du template"
          onClick={closeDetailsModal}
        >
          <div
            className="dashboard-divider w-full max-w-2xl rounded-2xl border bg-[var(--dashboard-sidebar)] p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="dashboard-faint text-xs uppercase tracking-[0.2em]">Détails</p>
                <h2 className="mt-2 text-xl font-semibold">{selectedTemplate.title}</h2>
              </div>
              <button
                type="button"
                onClick={closeDetailsModal}
                className="dashboard-icon-btn inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                aria-label="Fermer la fenêtre"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m5 5 10 10" />
                  <path d="m15 5-10 10" />
                </svg>
              </button>
            </div>

            <p className="dashboard-muted text-sm">{selectedTemplate.summary}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Catégorie</p>
                <p className="mt-1 text-sm font-medium">
                  {categoryLabels[selectedTemplate.category] ?? selectedTemplate.category}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Niveau</p>
                <p className="mt-1 text-sm font-medium">
                  {levelLabels[selectedTemplate.level] ?? selectedTemplate.level}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Type</p>
                <p className="mt-1 text-sm font-medium">
                  {fileTypeLabels[selectedTemplate.fileType] ?? selectedTemplate.fileType}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Objectif</p>
                <p className="mt-1 text-sm font-medium">
                  {objectiveLabels[selectedTemplate.objective] ?? selectedTemplate.objective}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Statut</p>
                <p className="mt-1 text-sm font-medium">
                  {selectedTemplate.isPublished ? "Publié" : "Brouillon"}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Mis en avant</p>
                <p className="mt-1 text-sm font-medium">
                  {selectedTemplate.isFeatured ? "Oui" : "Non"}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Mise à jour</p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(selectedTemplate.updatedAt)}
                </p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Date création</p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(selectedTemplate.createdAt)}
                </p>
              </div>
            </div>

            <div className="dashboard-divider mt-5 border-t pt-4">
              <p className="dashboard-faint text-xs">Slug interne</p>
              <p className="mt-1 text-sm">{selectedTemplate.slug}</p>
            </div>

            <div className="dashboard-divider mt-4 border-t pt-4">
              <p className="dashboard-faint text-xs uppercase tracking-wide">
                Documents existants
              </p>
              <div className="mt-3 rounded-xl border border-border/70">
                <div className="dashboard-divider flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {selectedTemplate.slug}.md
                    </p>
                    <p className="dashboard-faint mt-0.5 text-xs">text/markdown</p>
                  </div>
                  <a
                    href={`/api/document-templates/${selectedTemplate.slug}`}
                    className="dashboard-btn-primary shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Télécharger
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default DocumentTemplatesDataTable;
