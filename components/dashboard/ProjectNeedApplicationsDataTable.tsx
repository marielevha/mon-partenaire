"use client";

import { useActionState, useMemo, useState } from "react";
import { reviewNeedApplicationAction, type ReviewNeedApplicationState } from "@/app/dashboard/projects/applications/actions";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const initialReviewState: ReviewNeedApplicationState = null;

export type ProjectNeedApplicationTableItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  needId: string;
  needTitle: string;
  needType: string;
  applicantUserId: string;
  ownerUserId: string;
  applicantEmail: string | null;
  applicantFullName: string | null;
  message: string | null;
  proposedAmount: number | null;
  proposedRequiredCount: number | null;
  proposedEquityPercent: number | null;
  proposedSkillTags: string[];
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
};

type ProjectNeedApplicationsDataTableProps = {
  items: ProjectNeedApplicationTableItem[];
  canManageAny: boolean;
  canManageOwn: boolean;
  currentUserId: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(amount?: number | null) {
  if (typeof amount !== "number") return "—";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function statusBadgeClass(status: ProjectNeedApplicationTableItem["status"]) {
  if (status === "PENDING") {
    return "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200";
  }
  if (status === "ACCEPTED") {
    return "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200";
  }
  if (status === "REJECTED") {
    return "border border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-200";
  }
  return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200";
}

function statusLabel(status: ProjectNeedApplicationTableItem["status"]) {
  if (status === "PENDING") return "En attente";
  if (status === "ACCEPTED") return "Acceptée";
  if (status === "REJECTED") return "Refusée";
  return "Retirée";
}

function NeedApplicationActions({
  applicationId,
  canManage,
  pending,
}: {
  applicationId: string;
  canManage: boolean;
  pending: boolean;
}) {
  const [state, action] = useActionState(reviewNeedApplicationAction, initialReviewState);

  if (!canManage || !pending) {
    return (
      <div className="text-right text-[11px] text-text-secondary">
        {pending ? "Lecture seule" : "Action indisponible"}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input
        type="text"
        name="decisionNote"
        placeholder="Note (optionnel)"
        className="dashboard-input w-full rounded-md px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
      />
      <div className="flex justify-end gap-1.5">
        <button
          type="submit"
          name="decision"
          value="REJECT"
          className="dashboard-btn-secondary dashboard-danger-soft dashboard-danger rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
        >
          Refuser
        </button>
        <button
          type="submit"
          name="decision"
          value="ACCEPT"
          className="dashboard-btn-primary rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
        >
          Accepter
        </button>
      </div>
      {state ? (
        <p className={`text-right text-[11px] ${state.ok ? "text-emerald-600 dark:text-emerald-300" : "text-rose-500"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ProjectNeedApplicationsDataTable({
  items,
  canManageAny,
  canManageOwn,
  currentUserId,
}: ProjectNeedApplicationsDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProjectNeedApplicationTableItem["status"]>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<"ALL" | "MINE" | "OTHERS">(
    "ALL"
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      if (audienceFilter === "MINE" && item.applicantUserId !== currentUserId) {
        return false;
      }
      if (audienceFilter === "OTHERS" && item.applicantUserId === currentUserId) {
        return false;
      }
      if (!normalized) return true;
      const searchable = [
        item.projectTitle,
        item.needTitle,
        item.needType,
        item.applicantFullName ?? "",
        item.applicantEmail ?? "",
        item.status,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [audienceFilter, currentUserId, items, searchQuery, statusFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [effectiveCurrentPage, filteredItems, itemsPerPage]);

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
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Recherche</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Projet, besoin, candidat..."
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Statut</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            <option value="ALL">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Acceptées</option>
            <option value="REJECTED">Refusées</option>
            <option value="WITHDRAWN">Retirées</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Affichage</span>
          <select
            value={audienceFilter}
            onChange={(event) => {
              setAudienceFilter(event.target.value as typeof audienceFilter);
              setCurrentPage(1);
            }}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            <option value="ALL">Toutes les candidatures</option>
            <option value="MINE">Mes candidatures</option>
            <option value="OTHERS">Autres candidatures</option>
          </select>
        </label>

      </div>

      {paginatedItems.length === 0 ? (
        <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
          Aucune candidature pour ces critères.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full text-sm">
            <thead className="dashboard-panel">
              <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Projet / Besoin</th>
                <th className="px-4 py-3">Candidat</th>
                <th className="px-4 py-3">Proposition</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const canManageRow =
                  canManageAny ||
                  (canManageOwn && item.ownerUserId === currentUserId);
                return (
                <tr
                  key={item.id}
                  className="dashboard-divider border-b border-border/50 align-top transition-colors hover:bg-accent/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.projectTitle}</p>
                    <p className="mt-1 text-xs font-medium text-text-primary">
                      {item.needTitle}
                    </p>
                    <p className="dashboard-faint mt-1 text-xs">
                      {item.needType} • soumis le {formatDate(item.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.applicantFullName || "Utilisateur"}</p>
                    <p className="dashboard-faint mt-1 text-xs">
                      {item.applicantEmail || item.applicantUserId}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-xs">
                      {item.proposedAmount ? <p>Montant: {formatMoney(item.proposedAmount)}</p> : null}
                      {item.proposedRequiredCount ? <p>Quantité: {item.proposedRequiredCount}</p> : null}
                      {typeof item.proposedEquityPercent === "number" ? (
                        <p>Part: {item.proposedEquityPercent}%</p>
                      ) : null}
                      {item.proposedSkillTags.length > 0 ? (
                        <p>Compétences: {item.proposedSkillTags.join(", ")}</p>
                      ) : null}
                      {item.message ? (
                        <p className="dashboard-faint line-clamp-3 max-w-sm">{item.message}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    {item.decidedAt ? (
                      <p className="dashboard-faint mt-1 text-[11px]">
                        Décidée le {formatDate(item.decidedAt)}
                      </p>
                    ) : null}
                    {item.decisionNote ? (
                      <p className="dashboard-faint mt-1 text-[11px] line-clamp-2">{item.decisionNote}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <NeedApplicationActions
                      applicationId={item.id}
                      canManage={canManageRow}
                      pending={item.status === "PENDING"}
                    />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
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
          <p className="dashboard-faint text-sm">{totalItems} candidature(s)</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
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
            onClick={() =>
              setCurrentPage((previous) => Math.min(totalPages, previous + 1))
            }
            disabled={effectiveCurrentPage === totalPages}
            className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectNeedApplicationsDataTable;
