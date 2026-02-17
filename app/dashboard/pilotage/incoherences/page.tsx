import type { Metadata } from "next";
import Link from "next/link";
import { ProjectInconsistenciesDataTable } from "@/components/dashboard/ProjectInconsistenciesDataTable";
import prisma from "@/src/lib/prisma";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "Incohérences projets | Dashboard | Mon partenaire",
  description:
    "Liste des projets incohérents avec action de notification au propriétaire.",
};

type InconsistencyRow = {
  id: string;
  title: string;
  ownerId: string;
  ownerFullName: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
  invalidNeedsCount: number;
  isPublishedIncomplete: boolean;
  ownerEquityPercent: number;
  needsEquityPercent: number;
  allocatedShare: number;
};

function toOwnerLabel(ownerFullName: string | null, ownerId: string) {
  const normalized = ownerFullName?.trim();
  if (normalized) {
    return normalized;
  }
  return `Utilisateur ${ownerId.slice(0, 8)}`;
}

export default async function DashboardProjectInconsistenciesPage() {
  await requireCurrentUserPermission(RBAC_PERMISSIONS.DASHBOARD_QUALITY_READ, {
    redirectTo: "/dashboard",
  });

  const rows = await prisma.$queryRaw<InconsistencyRow[]>`
    SELECT
      p.id,
      p.title,
      p."ownerId",
      pr.full_name AS "ownerFullName",
      p.status::text AS status,
      p."updatedAt",
      COALESCE(ns."invalidNeedsCount", 0)::int AS "invalidNeedsCount",
      (
        p.status = 'PUBLISHED'
        AND (
          p."totalCapital" IS NULL
          OR btrim(COALESCE(p.summary, '')) = ''
          OR btrim(COALESCE(p.description, '')) = ''
        )
      ) AS "isPublishedIncomplete",
      COALESCE(p."ownerEquityPercent", 0)::int AS "ownerEquityPercent",
      COALESCE(ns."needsEquityPercent", 0)::int AS "needsEquityPercent",
      (
        COALESCE(p."ownerEquityPercent", 0) + COALESCE(ns."needsEquityPercent", 0)
      )::int AS "allocatedShare"
    FROM "Project" p
    LEFT JOIN (
      SELECT
        n."projectId",
        COUNT(*) FILTER (
          WHERE
            (n.type = 'FINANCIAL' AND n.amount IS NULL)
            OR (n.type = 'SKILL' AND COALESCE(n."requiredCount", 0) < 1)
            OR (n.type = 'MATERIAL' AND (n.description IS NULL OR btrim(n.description) = ''))
            OR (n.type = 'PARTNERSHIP' AND (n.description IS NULL OR btrim(n.description) = ''))
        )::int AS "invalidNeedsCount",
        COALESCE(SUM(COALESCE(n."equityShare", 0)), 0)::int AS "needsEquityPercent"
      FROM "ProjectNeed" n
      GROUP BY n."projectId"
    ) ns ON ns."projectId" = p.id
    LEFT JOIN public.profiles pr ON pr.id::text = p."ownerId"
    WHERE
      COALESCE(ns."invalidNeedsCount", 0) > 0
      OR (
        p.status = 'PUBLISHED'
        AND (
          p."totalCapital" IS NULL
          OR btrim(COALESCE(p.summary, '')) = ''
          OR btrim(COALESCE(p.description, '')) = ''
        )
      )
      OR (COALESCE(p."ownerEquityPercent", 0) + COALESCE(ns."needsEquityPercent", 0)) > 100
    ORDER BY
      (
        COALESCE(ns."invalidNeedsCount", 0)
        + CASE
          WHEN (
            p.status = 'PUBLISHED'
            AND (
              p."totalCapital" IS NULL
              OR btrim(COALESCE(p.summary, '')) = ''
              OR btrim(COALESCE(p.description, '')) = ''
            )
          ) THEN 1
          ELSE 0
        END
        + CASE
          WHEN (COALESCE(p."ownerEquityPercent", 0) + COALESCE(ns."needsEquityPercent", 0)) > 100
            THEN 1
          ELSE 0
        END
      ) DESC,
      p."updatedAt" DESC
  `;

  const items = rows.map((row) => {
    const issueLabels: string[] = [];

    if (row.invalidNeedsCount > 0) {
      issueLabels.push(`${row.invalidNeedsCount} besoin(s) invalide(s)`);
    }
    if (row.isPublishedIncomplete) {
      issueLabels.push("Projet publié incomplet");
    }
    if (row.allocatedShare > 100) {
      issueLabels.push(`Allocation ${row.allocatedShare}% > 100%`);
    }

    return {
      id: row.id,
      title: row.title,
      ownerId: row.ownerId,
      ownerFullName: toOwnerLabel(row.ownerFullName, row.ownerId),
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      invalidNeedsCount: row.invalidNeedsCount,
      isPublishedIncomplete: row.isPublishedIncomplete,
      ownerEquityPercent: row.ownerEquityPercent,
      needsEquityPercent: row.needsEquityPercent,
      allocatedShare: row.allocatedShare,
      issueLabels,
      severityScore: issueLabels.length,
    };
  });

  const projectsWithInvalidNeeds = items.filter((item) => item.invalidNeedsCount > 0).length;
  const projectsWithPublishedMissingData = items.filter(
    (item) => item.isPublishedIncomplete
  ).length;
  const projectsWithAllocationError = items.filter(
    (item) => item.allocatedShare > 100
  ).length;

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/pilotage" className="transition-colors hover:text-accent">
            Pilotage
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Incohérences projets</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Projets avec incohérences</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Cette vue centralise les projets à corriger et permet de notifier directement le
          propriétaire concerné.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Total incohérences</p>
          <p className="mt-2 text-2xl font-semibold">{items.length}</p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Besoins invalides</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {projectsWithInvalidNeeds}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Publiés incomplets</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
            {projectsWithPublishedMissingData}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Allocation &gt; 100%</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
            {projectsWithAllocationError}
          </p>
        </div>
      </div>

      <ProjectInconsistenciesDataTable items={items} />
    </section>
  );
}
