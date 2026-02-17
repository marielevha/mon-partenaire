import type { Metadata } from "next";
import Link from "next/link";
import { RbacRolesWorkspace } from "@/components/dashboard/RbacRolesWorkspace";
import { RbacTabs } from "@/components/dashboard/RbacTabs";
import { fetchRbacManagementData } from "@/src/lib/rbac/management-data";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserAnyPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "CRUD Rôles | RBAC | Dashboard",
  description: "Gestion CRUD des rôles et mapping permissions par rôle.",
};

export default async function DashboardRbacRolesPage() {
  const context = await requireCurrentUserAnyPermission(
    [RBAC_PERMISSIONS.RBAC_ROLES_READ, RBAC_PERMISSIONS.RBAC_ROLES_MANAGE],
    { redirectTo: "/dashboard/rbac" }
  );

  const canManageRoles = context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_ROLES_MANAGE);
  const data = await fetchRbacManagementData();

  const rolePermissionsByRoleId = data.rolePermissionRows.reduce<Record<string, string[]>>(
    (accumulator, row) => {
      const current = accumulator[row.roleId] ?? [];
      current.push(row.permissionCode);
      accumulator[row.roleId] = current;
      return accumulator;
    },
    {}
  );

  const assignmentCountByRoleId = data.roleAssignmentCountRows.reduce<Record<string, number>>(
    (accumulator, row) => {
      accumulator[row.roleId] = row.total;
      return accumulator;
    },
    {}
  );

  const protectedRoleCodes = new Set(["member", "operator", "admin", "super_admin"]);

  const enrichedRoles = data.roles.map((role) => ({
    ...role,
    permissionCodes: rolePermissionsByRoleId[role.id] ?? [],
    permissionCount: (rolePermissionsByRoleId[role.id] ?? []).length,
    assignmentCount: assignmentCountByRoleId[role.id] ?? 0,
    isSystem: role.isSystem || protectedRoleCodes.has(role.code),
  }));

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/rbac" className="transition-colors hover:text-accent">
            RBAC
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Rôles</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">CRUD des rôles</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Créez, modifiez et supprimez les rôles, puis configurez leurs permissions.
        </p>
      </div>

      <RbacTabs />

      {data.isMissingSchema ? (
        <div className="dashboard-panel rounded-2xl p-6">
          <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Schéma RBAC absent
            </p>
            <p className="mt-2 text-sm text-amber-700/90 dark:text-amber-200/90">
              Exécutez le script <code>supabase/rbac.sql</code> dans le SQL Editor Supabase puis
              rechargez cette page.
            </p>
          </div>
        </div>
      ) : null}

      {!data.isMissingSchema ? (
        <div className="dashboard-panel rounded-2xl p-6">
          <RbacRolesWorkspace
            roles={enrichedRoles}
            permissions={data.permissions}
            canManage={canManageRoles}
          />
        </div>
      ) : null}
    </section>
  );
}
