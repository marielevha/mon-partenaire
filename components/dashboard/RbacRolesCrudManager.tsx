"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRoleAction,
  deleteRoleAction,
  updateRoleAction,
  type RbacActionState,
} from "@/app/dashboard/rbac/actions";

type RoleCrudItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  assignmentCount: number;
};

type RbacRolesCrudManagerProps = {
  roles: RoleCrudItem[];
  canManage: boolean;
};

type SortField = "name" | "code" | "permissionCount" | "assignmentCount";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const initialState: RbacActionState = null;

function RoleCreateForm({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [state, action] = useActionState(createRoleAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state?.ok]);

  return (
    <div className="dashboard-panel-soft rounded-xl p-4">
      <p className="text-sm font-semibold">Nouveau rôle</p>
      <form action={action} className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_220px_1fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Code</span>
          <input
            name="code"
            required
            placeholder="analyst"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Nom</span>
          <input
            name="name"
            required
            placeholder="Analyste"
            disabled={!canManage}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Description</span>
          <input
            name="description"
            placeholder="Rôle en lecture pour reporting"
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

type RoleEditModalProps = {
  role: RoleCrudItem | null;
  onClose: () => void;
  canManage: boolean;
};

function RoleEditModal({ role, onClose, canManage }: RoleEditModalProps) {
  const router = useRouter();
  const [state, action] = useActionState(updateRoleAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state?.ok]);

  if (!role) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Modifier un rôle"
      onClick={onClose}
    >
      <div
        className="dashboard-divider w-full max-w-2xl rounded-2xl border bg-[var(--dashboard-sidebar)] p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="dashboard-faint text-xs uppercase tracking-[0.2em]">Édition</p>
            <h2 className="mt-2 text-xl font-semibold">{role.name}</h2>
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
          <input type="hidden" name="roleId" value={role.id} />

          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Code</span>
            <input
              name="code"
              defaultValue={role.code}
              disabled={!canManage || role.isSystem}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Nom</span>
            <input
              name="name"
              defaultValue={role.name}
              disabled={!canManage}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Description</span>
            <textarea
              name="description"
              defaultValue={role.description ?? ""}
              disabled={!canManage}
              rows={3}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-xs md:col-span-2">
            <input
              type="checkbox"
              name="isSystem"
              defaultChecked={role.isSystem}
              disabled={!canManage || role.isSystem}
              className="h-4 w-4 rounded border-border text-accent"
            />
            <span className="dashboard-faint">Rôle système</span>
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

type RoleDeleteFormProps = {
  role: RoleCrudItem;
  canManage: boolean;
};

function RoleDeleteForm({ role, canManage }: RoleDeleteFormProps) {
  const router = useRouter();
  const [state, action] = useActionState(deleteRoleAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state?.ok]);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="roleId" value={role.id} />
        <button
          type="submit"
          disabled={!canManage || role.isSystem}
          className="dashboard-icon-btn dashboard-danger-soft dashboard-danger inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={`Supprimer le rôle ${role.name}`}
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

export function RbacRolesCrudManager({ roles, canManage }: RbacRolesCrudManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedRole, setSelectedRole] = useState<RoleCrudItem | null>(null);

  const filteredRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return roles;
    }

    return roles.filter((role) => {
      const searchable = [role.code, role.name, role.description ?? ""].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [roles, searchQuery]);

  const sortedRoles = useMemo(() => {
    const items = [...filteredRoles];

    items.sort((left, right) => {
      let comparison = 0;

      if (sortField === "name") {
        comparison = left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
      } else if (sortField === "code") {
        comparison = left.code.localeCompare(right.code, "fr", { sensitivity: "base" });
      } else if (sortField === "permissionCount") {
        comparison = left.permissionCount - right.permissionCount;
      } else {
        comparison = left.assignmentCount - right.assignmentCount;
      }

      if (comparison === 0) {
        comparison = left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return items;
  }, [filteredRoles, sortDirection, sortField]);

  const totalItems = sortedRoles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRoles = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * itemsPerPage;
    return sortedRoles.slice(start, start + itemsPerPage);
  }, [effectiveCurrentPage, itemsPerPage, sortedRoles]);

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
        <RoleCreateForm canManage={canManage} />

        <div className="dashboard-panel-soft rounded-xl p-4">
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
                placeholder="Code, nom ou description..."
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

          {paginatedRoles.length === 0 ? (
            <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
              Aucun rôle trouvé pour ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead className="dashboard-panel">
                  <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="transition-colors hover:text-accent"
                      >
                        Rôle
                      </button>
                    </th>
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
                        onClick={() => toggleSort("permissionCount")}
                        className="transition-colors hover:text-accent"
                      >
                        Permissions
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("assignmentCount")}
                        className="transition-colors hover:text-accent"
                      >
                        Affectations
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="dashboard-divider border-b border-border/50 align-top transition-colors hover:bg-accent/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{role.name}</p>
                        <p className="dashboard-faint mt-1 line-clamp-2 max-w-sm text-xs">
                          {role.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">{role.code}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            role.isSystem
                              ? "border border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-200"
                              : "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200"
                          }`}
                        >
                          {role.isSystem ? "Système" : "Personnalisé"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{role.permissionCount}</td>
                      <td className="px-4 py-3">{role.assignmentCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRole(role)}
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

                          <RoleDeleteForm role={role} canManage={canManage} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paginatedRoles.length > 0 ? (
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

      <RoleEditModal role={selectedRole} onClose={() => setSelectedRole(null)} canManage={canManage} />
    </>
  );
}

export default RbacRolesCrudManager;
