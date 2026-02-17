import type { Metadata } from "next";
import Link from "next/link";
import { RbacPermissionsCrudManager } from "@/components/dashboard/RbacPermissionsCrudManager";
import { RbacTabs } from "@/components/dashboard/RbacTabs";
import { fetchRbacManagementData } from "@/src/lib/rbac/management-data";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserAnyPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "CRUD Permissions | RBAC | Dashboard",
  description: "Gestion CRUD des permissions RBAC.",
};

export default async function DashboardRbacPermissionsPage() {
  const context = await requireCurrentUserAnyPermission(
    [RBAC_PERMISSIONS.RBAC_ROLES_READ, RBAC_PERMISSIONS.RBAC_ROLES_MANAGE],
    { redirectTo: "/dashboard/rbac" }
  );

  const canManageRoles = context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_ROLES_MANAGE);
  const data = await fetchRbacManagementData();

  const roleUsageCountByPermissionId = data.rolePermissionRows.reduce<Record<string, number>>(
    (accumulator, row) => {
      accumulator[row.permissionId] = (accumulator[row.permissionId] ?? 0) + 1;
      return accumulator;
    },
    {}
  );

  const protectedPermissionCodes = new Set<string>(Object.values(RBAC_PERMISSIONS));

  const enrichedPermissions = data.permissions.map((permission) => ({
    ...permission,
    roleUsageCount: roleUsageCountByPermissionId[permission.id] ?? 0,
    isProtected: protectedPermissionCodes.has(permission.code),
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
          <span className="dashboard-muted">Permissions</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">CRUD des permissions</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Gérez le catalogue de permissions utilisées dans le système RBAC.
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
          <div className="mb-4">
            <p className="text-sm font-semibold">Permissions</p>
            <p className="dashboard-faint text-sm">
              Création, mise à jour et suppression des permissions.
            </p>
          </div>
          <RbacPermissionsCrudManager permissions={enrichedPermissions} canManage={canManageRoles} />
        </div>
      ) : null}
    </section>
  );
}
