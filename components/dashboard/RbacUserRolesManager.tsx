"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignUserRoleAction,
  revokeUserRoleAction,
  type RbacActionState,
} from "@/app/dashboard/rbac/actions";

type UserItem = {
  id: string;
  email: string | null;
  fullName: string | null;
};

type RoleItem = {
  id: string;
  code: string;
  name: string;
};

type UserRoleAssignment = {
  id: string;
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  roleId: string;
  roleCode: string;
  roleName: string;
  assignedByUserId: string | null;
  createdAt: string;
};

type RbacUserRolesManagerProps = {
  users: UserItem[];
  roles: RoleItem[];
  assignments: UserRoleAssignment[];
  canManage: boolean;
};

const initialState: RbacActionState = null;

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function RbacUserRolesManager({
  users,
  roles,
  assignments,
  canManage,
}: RbacUserRolesManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [assignState, assignAction] = useActionState(assignUserRoleAction, initialState);
  const [revokeState, revokeAction] = useActionState(revokeUserRoleAction, initialState);

  const filteredAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const searchable = [
        assignment.userFullName ?? "",
        assignment.userEmail ?? "",
        assignment.roleCode,
        assignment.roleName,
        assignment.userId,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [assignments, searchQuery]);

  useEffect(() => {
    if (assignState?.ok || revokeState?.ok) {
      router.refresh();
    }
  }, [assignState?.ok, revokeState?.ok, router]);

  return (
    <div className="space-y-4">
      <div className="dashboard-panel-soft rounded-xl p-4">
        <p className="text-sm font-semibold">Nouvelle affectation</p>
        <form action={assignAction} className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Utilisateur</span>
            <select
              name="targetUserId"
              required
              disabled={!canManage}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              defaultValue={users[0]?.id ?? ""}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {(user.fullName?.trim() || user.email || user.id).slice(0, 120)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Rôle</span>
            <select
              name="roleId"
              required
              disabled={!canManage}
              className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              defaultValue={roles[0]?.id ?? ""}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!canManage}
              className="dashboard-btn-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Affecter
            </button>
          </div>
        </form>

        {!canManage ? (
          <p className="dashboard-faint mt-3 text-sm">
            Vous avez un accès en lecture seule sur les affectations de rôles.
          </p>
        ) : null}

        {assignState ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              assignState.ok
                ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
            }`}
          >
            {assignState.message}
          </p>
        ) : null}
      </div>

      <div className="dashboard-panel-soft rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="dashboard-faint text-xs uppercase tracking-wide">Recherche</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Utilisateur, email, rôle..."
              className="dashboard-input w-[320px] max-w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>
          <p className="dashboard-faint text-sm">{filteredAssignments.length} affectation(s)</p>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-border/70">
          <table className="min-w-full text-sm">
            <thead className="dashboard-panel-soft">
              <tr className="dashboard-faint border-b border-border/70 text-left text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Affecté le</th>
                <th className="px-4 py-3">Assigné par</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="dashboard-divider border-b border-border/50 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">
                      {assignment.userFullName?.trim() || "Utilisateur"}
                    </p>
                    <p className="dashboard-faint text-xs">{assignment.userEmail || assignment.userId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      {assignment.roleName}
                    </span>
                    <p className="dashboard-faint mt-1 text-xs">{assignment.roleCode}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(assignment.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="dashboard-faint text-xs">
                      {assignment.assignedByUserId ? assignment.assignedByUserId.slice(0, 8) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <form action={revokeAction} className="inline-flex">
                        <input type="hidden" name="userRoleId" value={assignment.id} />
                        <button
                          type="submit"
                          className="dashboard-btn-secondary dashboard-danger-soft dashboard-danger inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-colors"
                        >
                          Retirer
                        </button>
                      </form>
                    ) : (
                      <span className="dashboard-faint text-xs">Lecture seule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {revokeState ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              revokeState.ok
                ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
            }`}
          >
            {revokeState.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default RbacUserRolesManager;
