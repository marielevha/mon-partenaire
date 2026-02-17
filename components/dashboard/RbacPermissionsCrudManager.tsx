"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPermissionAction,
  deletePermissionAction,
  updatePermissionAction,
  type RbacActionState,
} from "@/app/dashboard/rbac/actions";

type PermissionCrudItem = {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
  isProtected: boolean;
  roleUsageCount: number;
};

type RbacPermissionsCrudManagerProps = {
  permissions: PermissionCrudItem[];
  canManage: boolean;
};

type SortField = "code" | "resource" | "action" | "roleUsageCount";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const initialState: RbacActionState = null;

function PermissionCreateForm({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [state, action] = useActionState(createPermissionAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state?.ok]);

  return (
    <div className="dashboard-panel-soft rounded-xl p-4">
      <p className="text-sm font-semibold">Nouvelle permission</p>
      <form
        action={action}
        className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_180px_160px_1fr_auto]"
      >
        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Code</span>
          <input
            name="code"
            required
            placeholder="dashboard.reports.read"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Ressource</span>
          <input
            name="resource"
            required
            placeholder="dashboard.reports"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Action</span>
          <input
            name="action"
            required
            placeholder="read"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Description</span>
          <input
            name="description"
            placeholder="Accès lecture rapports"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={!canManage}
            className="dashboard-btn-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Créer
          </button>
        </div>
      </form>

      {state ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

type PermissionEditModalProps = {
  permission: PermissionCrudItem | null;
  onClose: () => void;
  canManage: boolean;
};

function PermissionEditModal({ permission, onClose, canManage }: PermissionEditModalProps) {
  const router = useRouter();
  const [state, action] = useActionState(updatePermissionAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state?.ok]);

  if (!permission) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Modifier une permission"
      onClick={onClose}
    >
      <div
        className="dashboard-divider w-full max-w-2xl rounded-2xl border bg-[var(--dashboard-sidebar)] p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="dashboard-faint text-xs uppercase tracking-[0.2em]">Édition</p>
            <h2 className="mt-2 text-xl font-semibold">{permission.code}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <form action={action} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="permissionId" value={permission.id} />

          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Code</span>
            <input
              name="code"
              defaultValue={permission.code}
              disabled={!canManage || permission.isProtected}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Ressource</span>
            <input
              name="resource"
              defaultValue={permission.resource}
              disabled={!canManage}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Action</span>
            <input
              name="action"
              defaultValue={permission.action}
              disabled={!canManage}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Description</span>
            <textarea
              name="description"
              defaultValue={permission.description ?? ""}
              disabled={!canManage}
              rows={3}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canManage}
              className="dashboard-btn-primary rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </form>

        {state ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              state.ok
                ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type PermissionDeleteFormProps = {
  permission: PermissionCrudItem;
  canManage: boolean;
};

function PermissionDeleteForm({ permission, canManage }: PermissionDeleteFormProps) {
  const router = useRouter();
  const [state, action] = useActionState(deletePermissionAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state?.ok]);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="permissionId" value={permission.id} />
        <button
          type="submit"
          disabled={!canManage || permission.isProtected}
          className="dashboard-icon-btn dashboard-danger-soft dashboard-danger inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={`Supprimer la permission ${permission.code}`}
          title="Supprimer"
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
      </form>
      {state && !state.ok ? (
        <p className="max-w-[220px] text-right text-[11px] text-rose-500">{state.message}</p>
      ) : null}
    </div>
  );
}

export function RbacPermissionsCrudManager({
  permissions,
  canManage,
}: RbacPermissionsCrudManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedPermission, setSelectedPermission] = useState<PermissionCrudItem | null>(null);

  const resourceOptions = useMemo(
    () => Array.from(new Set(permissions.map((permission) => permission.resource))).sort(),
    [permissions]
  );

  const filteredPermissions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return permissions.filter((permission) => {
      if (resourceFilter !== "all" && permission.resource !== resourceFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        permission.code,
        permission.resource,
        permission.action,
        permission.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [permissions, resourceFilter, searchQuery]);

  const sortedPermissions = useMemo(() => {
    const items = [...filteredPermissions];

    items.sort((left, right) => {
      let comparison = 0;

      if (sortField === "code") {
        comparison = left.code.localeCompare(right.code, "fr", { sensitivity: "base" });
      } else if (sortField === "resource") {
        comparison = left.resource.localeCompare(right.resource, "fr", { sensitivity: "base" });
      } else if (sortField === "action") {
        comparison = left.action.localeCompare(right.action, "fr", { sensitivity: "base" });
      } else {
        comparison = left.roleUsageCount - right.roleUsageCount;
      }

      if (comparison === 0) {
        comparison = left.code.localeCompare(right.code, "fr", { sensitivity: "base" });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [filteredPermissions, sortDirection, sortField]);

  const totalItems = sortedPermissions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPermissions = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * itemsPerPage;
    return sortedPermissions.slice(start, start + itemsPerPage);
  }, [effectiveCurrentPage, itemsPerPage, sortedPermissions]);

  const visiblePages = useMemo(() => {
    const visiblePageCount = 5;
    let startPage = Math.max(1, effectiveCurrentPage - Math.floor(visiblePageCount / 2));
    const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
    if (endPage - startPage + 1 < visiblePageCount) {
      startPage = Math.max(1, endPage - visiblePageCount + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [effectiveCurrentPage, totalPages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      setCurrentPage(1);
      return;
    }
    setSortField(field);
    setSortDirection("asc");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-4">
        <PermissionCreateForm canManage={canManage} />

        <div className="dashboard-panel-soft rounded-xl p-4">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="dashboard-faint text-xs uppercase tracking-wide">Recherche</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Code, ressource, action..."
                className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="dashboard-faint text-xs uppercase tracking-wide">Ressource</span>
              <select
                value={resourceFilter}
                onChange={(event) => {
                  setResourceFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              >
                <option value="all">Toutes</option>
                {resourceOptions.map((resource) => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-end gap-2">
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

          {paginatedPermissions.length === 0 ? (
            <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
              Aucune permission trouvée pour ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead className="dashboard-panel">
                  <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("code")}
                        className="transition-colors hover:text-accent"
                      >
                        Code
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("resource")}
                        className="transition-colors hover:text-accent"
                      >
                        Ressource
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("action")}
                        className="transition-colors hover:text-accent"
                      >
                        Action
                      </button>
                    </th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("roleUsageCount")}
                        className="transition-colors hover:text-accent"
                      >
                        Rôles
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPermissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="dashboard-divider border-b border-border/50 align-top transition-colors hover:bg-accent/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">{permission.code}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            permission.isProtected
                              ? "border border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-200"
                              : "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200"
                          }`}
                        >
                          {permission.isProtected ? "Système" : "Personnalisée"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{permission.resource}</td>
                      <td className="px-4 py-3">{permission.action}</td>
                      <td className="px-4 py-3">
                        <p className="dashboard-faint line-clamp-2 max-w-sm text-xs">
                          {permission.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{permission.roleUsageCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPermission(permission)}
                            disabled={!canManage}
                            title="Modifier"
                            aria-label="Modifier"
                            className="dashboard-icon-btn inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-45"
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
                          </button>

                          <PermissionDeleteForm permission={permission} canManage={canManage} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paginatedPermissions.length > 0 ? (
            <div className="dashboard-divider mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="dashboard-faint text-sm">
                Page {effectiveCurrentPage} / {totalPages}
              </p>
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
          ) : null}

          <p className="dashboard-faint mt-3 text-xs">{totalItems} résultat(s) filtré(s)</p>
        </div>
      </div>

      <PermissionEditModal
        permission={selectedPermission}
        onClose={() => setSelectedPermission(null)}
        canManage={canManage}
      />
    </>
  );
}

export default RbacPermissionsCrudManager;
