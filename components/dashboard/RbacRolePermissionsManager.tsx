"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateRolePermissionsAction, type RbacActionState } from "@/app/dashboard/rbac/actions";

type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCodes: string[];
};

type PermissionItem = {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
};

type RbacRolePermissionsManagerProps = {
  roles: RoleItem[];
  permissions: PermissionItem[];
  canManage: boolean;
};

const initialState: RbacActionState = null;

function SaveButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="dashboard-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      Enregistrer les permissions
    </button>
  );
}

export function RbacRolePermissionsManager({
  roles,
  permissions,
  canManage,
}: RbacRolePermissionsManagerProps) {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [state, formAction] = useActionState(updateRolePermissionsAction, initialState);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();

    for (const permission of permissions) {
      if (resourceFilter !== "all" && permission.resource !== resourceFilter) {
        continue;
      }

      if (normalizedSearch) {
        const searchable = [
          permission.code,
          permission.resource,
          permission.action,
          permission.description ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(normalizedSearch)) {
          continue;
        }
      }

      const group = map.get(permission.resource) ?? [];
      group.push(permission);
      map.set(permission.resource, group);
    }

    return Array.from(map.entries())
      .map(([resource, items]) => ({
        resource,
        items: items.sort((left, right) => left.code.localeCompare(right.code)),
      }))
      .sort((left, right) => left.resource.localeCompare(right.resource));
  }, [permissions, normalizedSearch, resourceFilter]);

  const availableResources = useMemo(
    () => Array.from(new Set(permissions.map((permission) => permission.resource))).sort(),
    [permissions]
  );

  const visiblePermissionCount = useMemo(
    () => groupedPermissions.reduce((total, group) => total + group.items.length, 0),
    [groupedPermissions]
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  if (!selectedRole) {
    return (
      <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-8 text-center text-sm">
        Aucun rôle disponible.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex min-w-[240px] flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Rôle</span>
          <select
            value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>
        </label>

        <div className="dashboard-faint max-w-xl text-xs">
          <p className="font-semibold text-text-primary">{selectedRole.name}</p>
          <p className="mt-1">{selectedRole.description || "Aucune description."}</p>
          <p className="mt-1">{selectedRole.permissionCodes.length} permission(s) active(s).</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Recherche</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Code, ressource, action..."
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="dashboard-faint text-xs uppercase tracking-wide">Ressource</span>
          <select
            value={resourceFilter}
            onChange={(event) => setResourceFilter(event.target.value)}
            className="dashboard-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            <option value="all">Toutes</option>
            {availableResources.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </label>

        <div className="dashboard-faint flex items-end text-sm">
          {visiblePermissionCount} permission(s) visibles
        </div>
      </div>

      {state ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <form key={selectedRole.id} action={formAction} className="space-y-4">
        <input type="hidden" name="roleId" value={selectedRole.id} />

        <div className="grid gap-4 lg:grid-cols-2">
          {groupedPermissions.map((group) => (
            <fieldset key={group.resource} className="dashboard-panel-soft rounded-xl p-4">
              <legend className="dashboard-faint mb-2 text-xs uppercase tracking-[0.16em]">
                {group.resource}
              </legend>
              <div className="space-y-2">
                {group.items.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/5"
                  >
                    <input
                      type="checkbox"
                      name="permissionCodes"
                      value={permission.code}
                      defaultChecked={selectedRole.permissionCodes.includes(permission.code)}
                      disabled={!canManage}
                      className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span>
                      <span className="text-sm font-medium">{permission.code}</span>
                      <span className="dashboard-faint block text-xs">
                        {permission.description || `${permission.resource} / ${permission.action}`}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {groupedPermissions.length === 0 ? (
          <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-8 text-center text-sm">
            Aucune permission ne correspond aux filtres.
          </div>
        ) : null}

        {canManage ? (
          <div className="flex justify-end">
            <SaveButton disabled={false} />
          </div>
        ) : (
          <p className="dashboard-faint text-sm">
            Vous avez un accès en lecture seule sur les permissions des rôles.
          </p>
        )}
      </form>
    </div>
  );
}

export default RbacRolePermissionsManager;
