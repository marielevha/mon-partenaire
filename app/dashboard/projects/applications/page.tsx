import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/src/lib/prisma";
import {
  isMissingProjectNeedApplicationsSchemaError,
  listNeedApplicationsForOwner,
  listNeedApplicationsForUser,
} from "@/src/lib/project-need-applications";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserPermission } from "@/src/lib/rbac/server";
import { userHasPermission } from "@/src/lib/rbac/core";
import {
  ProjectNeedApplicationsDataTable,
  type ProjectNeedApplicationTableItem,
} from "@/components/dashboard/ProjectNeedApplicationsDataTable";

export const metadata: Metadata = {
  title: "Candidatures projets | Dashboard | Mon partenaire",
  description: "Validez ou refusez les candidatures sur les besoins de vos projets.",
};

export default async function DashboardProjectApplicationsPage() {
  const context = await requireCurrentUserPermission(
    RBAC_PERMISSIONS.DASHBOARD_PROJECTS_READ,
    { redirectTo: "/dashboard" }
  );

  const [canManageOwn, canManageAny] = await Promise.all([
    userHasPermission(context.userId, RBAC_PERMISSIONS.DASHBOARD_PROJECTS_UPDATE_OWN),
    userHasPermission(context.userId, RBAC_PERMISSIONS.DASHBOARD_PROJECTS_UPDATE_ANY),
  ]);

  let isMissingSchema = false;
  try {
    await prisma.$queryRaw`SELECT 1 FROM public."ProjectNeedApplication" LIMIT 1`;
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      isMissingSchema = true;
    } else {
      throw error;
    }
  }

  const rows = isMissingSchema
    ? []
    : canManageAny
      ? await listNeedApplicationsForOwner(null, {
          status: "ALL",
          limit: 2000,
        })
      : await listNeedApplicationsForUser(context.userId, {
          status: "ALL",
          limit: 2000,
        });

  const items: ProjectNeedApplicationTableItem[] = rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    projectStatus: row.projectStatus,
    needId: row.needId,
    needTitle: row.needTitle,
    needType: row.needType,
    applicantUserId: row.applicantUserId,
    ownerUserId: row.ownerUserId,
    applicantEmail: row.applicantEmail,
    applicantFullName: row.applicantFullName,
    message: row.message,
    proposedAmount: row.proposedAmount,
    proposedRequiredCount: row.proposedRequiredCount,
    proposedEquityPercent: row.proposedEquityPercent,
    proposedSkillTags: row.proposedSkillTags,
    status: row.status,
    decisionNote: row.decisionNote,
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));

  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const acceptedCount = items.filter((item) => item.status === "ACCEPTED").length;
  const rejectedCount = items.filter((item) => item.status === "REJECTED").length;

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/projects" className="transition-colors hover:text-accent">
            Mes projets
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Candidatures</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Candidatures projets</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Gérez les candidatures reçues sur les besoins publiés et validez les adhésions en
          deux étapes: candidature puis acceptation.
        </p>
      </div>

      {isMissingSchema ? (
        <div className="dashboard-panel rounded-2xl p-6">
          <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Schéma adhésion absent
            </p>
            <p className="mt-2 text-sm text-amber-700/90 dark:text-amber-200/90">
              Exécutez <code>supabase/project_need_applications.sql</code> (et{" "}
              <code>supabase/project_needs_upgrade.sql</code> si nécessaire), puis
              rechargez cette page.
            </p>
          </div>
        </div>
      ) : null}

      {!isMissingSchema ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="dashboard-panel rounded-2xl p-4">
            <p className="dashboard-faint text-xs uppercase tracking-wide">En attente</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
              {pendingCount}
            </p>
          </div>
          <div className="dashboard-panel rounded-2xl p-4">
            <p className="dashboard-faint text-xs uppercase tracking-wide">Acceptées</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
              {acceptedCount}
            </p>
          </div>
          <div className="dashboard-panel rounded-2xl p-4">
            <p className="dashboard-faint text-xs uppercase tracking-wide">Refusées</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
              {rejectedCount}
            </p>
          </div>
        </div>
      ) : null}

      {!isMissingSchema ? (
        <ProjectNeedApplicationsDataTable
          items={items}
          canManageAny={canManageAny}
          canManageOwn={canManageOwn}
          currentUserId={context.userId}
        />
      ) : null}
    </section>
  );
}
