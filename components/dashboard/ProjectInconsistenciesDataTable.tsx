"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  notifyProjectOwnerAction,
  type NotifyOwnerState,
} from "@/app/dashboard/pilotage/incoherences/actions";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const initialNotifyState: NotifyOwnerState = null;

export type ProjectInconsistencyTableItem = {
  id: string;
  title: string;
  ownerId: string;
  ownerFullName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
  invalidNeedsCount: number;
  isPublishedIncomplete: boolean;
  ownerEquityPercent: number;
  needsEquityPercent: number;
  allocatedShare: number;
  issueLabels: string[];
  severityScore: number;
};

type ProjectInconsistenciesDataTableProps = {
  items: ProjectInconsistencyTableItem[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: ProjectInconsistencyTableItem["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "Publié";
    case "ARCHIVED":
      return "Clôturé";
    default:
      return "Brouillon";
  }
}

function getStatusBadgeClass(status: ProjectInconsistencyTableItem["status"]) {
  if (status === "PUBLISHED") {
    return "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200";
  }
  if (status === "ARCHIVED") {
    return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200";
  }
  return "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200";
}

function NotifyOwnerButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="dashboard-btn-primary inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 animate-spin" fill="none">
            <circle cx="10" cy="10" r="7" className="opacity-25" stroke="currentColor" strokeWidth="2" />
            <path d="M17 10a7 7 0 0 0-7-7" className="opacity-90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Envoi...
        </>
      ) : (
        "Notifier"
      )}
    </button>
  );
}

function NotifyOwnerForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(notifyProjectOwnerAction, initialNotifyState);
  const isSuccess = state?.ok === true;
  const isError = state?.ok === false;

  useEffect(() => {
    if (isSuccess) {
      router.refresh();
    }
  }, [isSuccess, router]);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <NotifyOwnerButton />
      </form>
      {isSuccess ? (
        <p className="max-w-[220px] text-right text-[11px] text-emerald-600 dark:text-emerald-300">
          {state.message}
        </p>
      ) : null}
      {isError ? (
        <p className="max-w-[220px] text-right text-[11px] text-rose-500">{state.message}</p>
      ) : null}
    </div>
  );
}

export function ProjectInconsistenciesDataTable({
  items,
}: ProjectInconsistenciesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) => {
      const searchable = [
        item.title,
        item.ownerFullName,
        item.ownerId,
        getStatusLabel(item.status),
        ...item.issueLabels,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [items, searchQuery]);

  const sortedItems = useMemo(() => {
    const clone = [...filteredItems];
    clone.sort((left, right) => {
      if (left.severityScore !== right.severityScore) {
        return right.severityScore - left.severityScore;
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return clone;
  }, [filteredItems]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [effectiveCurrentPage, itemsPerPage, sortedItems]);

  const visiblePages = useMemo(() => {
    const visiblePageCount = 5;
    let startPage = Math.max(1, effectiveCurrentPage - Math.floor(visiblePageCount / 2));
    const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
    if (endPage - startPage + 1 < visiblePageCount) {
      startPage = Math.max(1, endPage - visiblePageCount + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [effectiveCurrentPage, totalPages]);

  return (
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
            placeholder="Projet, propriétaire, statut, incohérence..."
            className="dashboard-input w-full min-w-0 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 sm:w-[340px]"
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

      {paginatedItems.length === 0 ? (
        <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
          Aucun projet incohérent pour ces critères.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full text-sm">
            <thead className="dashboard-panel-soft">
              <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3">Propriétaire</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Incohérences</th>
                <th className="px-4 py-3">Mise à jour</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="dashboard-divider border-b border-border/50 align-top transition-colors hover:bg-accent/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="dashboard-faint mt-1 text-xs">{item.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.ownerFullName}</p>
                    <p className="dashboard-faint mt-1 text-xs">{item.ownerId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.issueLabels.map((issue) => (
                        <span
                          key={issue}
                          className="inline-flex rounded-full border border-rose-300/60 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-400/30 dark:text-rose-200"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                    <p className="dashboard-faint mt-1 text-xs">
                      Parts: porteur {item.ownerEquityPercent}% + besoins {item.needsEquityPercent}% ={" "}
                      {item.allocatedShare}%
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <NotifyOwnerForm projectId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="dashboard-faint text-xs">
          {totalItems === 0
            ? "0 résultat"
            : `${(effectiveCurrentPage - 1) * itemsPerPage + 1}-${Math.min(
                effectiveCurrentPage * itemsPerPage,
                totalItems
              )} sur ${totalItems}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={effectiveCurrentPage <= 1}
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
            onClick={() =>
              setCurrentPage((previous) => Math.min(totalPages, previous + 1))
            }
            disabled={effectiveCurrentPage >= totalPages}
            className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectInconsistenciesDataTable;
