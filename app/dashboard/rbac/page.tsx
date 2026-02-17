import type { Metadata } from "next";
import Link from "next/link";
import { RbacTabs } from "@/components/dashboard/RbacTabs";
import { RbacUserRolesManager } from "@/components/dashboard/RbacUserRolesManager";
import { fetchRbacManagementData } from "@/src/lib/rbac/management-data";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserAnyPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "RBAC | Dashboard | Mon partenaire",
  description: "Centre RBAC: affectations utilisateurs, rôles et permissions.",
};

export default async function DashboardRbacPage() {
  const context = await requireCurrentUserAnyPermission(
    [
      RBAC_PERMISSIONS.RBAC_ROLES_READ,
      RBAC_PERMISSIONS.RBAC_ROLES_MANAGE,
      RBAC_PERMISSIONS.RBAC_USER_ROLES_READ,
      RBAC_PERMISSIONS.RBAC_USER_ROLES_MANAGE,
    ],
    { redirectTo: "/dashboard" }
  );

  const canReadRoles =
    context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_ROLES_READ) ||
    context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_ROLES_MANAGE);

  const canReadUserRoles =
    context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_USER_ROLES_READ) ||
    context.permissionCodes.includes(RBAC_PERMISSIONS.RBAC_USER_ROLES_MANAGE);

  const canManageUserRoles = context.permissionCodes.includes(
    RBAC_PERMISSIONS.RBAC_USER_ROLES_MANAGE
  );

  const data = await fetchRbacManagementData({
    includeUserAssignments: canReadUserRoles,
  });

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <span className="dashboard-muted">RBAC</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Centre RBAC</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Gérez les affectations utilisateurs et accédez aux pages dédiées pour les CRUD rôles et
          permissions.
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
        <div className="grid gap-4 md:grid-cols-2">
          {canReadRoles ? (
            <Link
              href="/dashboard/rbac/roles"
              className="dashboard-panel rounded-2xl p-5 transition hover:border-accent/50"
            >
              <p className="text-sm font-semibold">CRUD Rôles</p>
              <p className="dashboard-faint mt-2 text-sm">
                Créer, modifier et supprimer les rôles, puis associer leurs permissions.
              </p>
            </Link>
          ) : null}

          {canReadRoles ? (
            <Link
              href="/dashboard/rbac/permissions"
              className="dashboard-panel rounded-2xl p-5 transition hover:border-accent/50"
            >
              <p className="text-sm font-semibold">CRUD Permissions</p>
              <p className="dashboard-faint mt-2 text-sm">
                Administrer le catalogue de permissions utilisées par les rôles.
              </p>
            </Link>
          ) : null}
        </div>
      ) : null}

      {!data.isMissingSchema && canReadUserRoles ? (
        <div className="dashboard-panel rounded-2xl p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold">Affectations utilisateur</p>
            <p className="dashboard-faint text-sm">
              Attribuez ou retirez des rôles aux utilisateurs connectés.
            </p>
          </div>
          <RbacUserRolesManager
            users={data.users}
            roles={data.roles}
            assignments={data.userRoleRows.map((row) => ({
              ...row,
              createdAt: row.createdAt.toISOString(),
            }))}
            canManage={canManageUserRoles}
          />
        </div>
      ) : null}
    </section>
  );
}
