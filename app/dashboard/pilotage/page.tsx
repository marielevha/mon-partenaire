import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { PilotageBusinessPerformanceCharts } from "@/components/dashboard/PilotageBusinessPerformanceCharts";
import { PilotageDonutChart } from "@/components/dashboard/PilotageDonutChart";
import { PilotageFunnelChart } from "@/components/dashboard/PilotageFunnelChart";
import { PilotageProjectCreationChart } from "@/components/dashboard/PilotageProjectCreationChart";
import prisma from "@/src/lib/prisma";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "Pilotage | Dashboard Mon partenaire",
  description: "Pilotage business, opérationnel et qualité de la plateforme.",
};

type CountRow = { count: number };
type ProfilesCountRow = {
  total: number;
  last7d: number;
  last30d: number;
};
type FunnelRow = {
  ownersWithProject: number;
  ownersWithPublishedProject: number;
  ownersWithArchivedProject: number;
};
type AveragePublishLeadRow = { avgDays: number | null };
type AllocationAnomalyRow = {
  id: string;
  title: string;
  allocatedShare: number;
};
type ContactMessageRecord = {
  createdAt?: string;
};
type SeriesPoint = {
  label: string;
  value: number;
};

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
};

function MetricCard({ label, value, hint, tone = "default" }: MetricCardProps) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-200"
        : "text-text-primary";

  return (
    <div className="dashboard-panel rounded-2xl p-4">
      <p className="dashboard-faint text-xs uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {hint ? <p className="dashboard-faint mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

function formatMoney(amount?: number | null) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.max(0, Math.round(value))}%`;
}

function formatDays(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)} j`;
}

async function getProfilesCounts() {
  try {
    const rows = await prisma.$queryRaw<ProfilesCountRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS "last7d",
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS "last30d"
      FROM public.profiles
    `;
    return rows[0] ?? { total: 0, last7d: 0, last30d: 0 };
  } catch {
    return { total: 0, last7d: 0, last30d: 0 };
  }
}

async function getFunnelStats() {
  const rows = await prisma.$queryRaw<FunnelRow[]>`
    SELECT
      COUNT(DISTINCT p."ownerId")::int AS "ownersWithProject",
      COUNT(DISTINCT p."ownerId") FILTER (WHERE p.status = 'PUBLISHED')::int AS "ownersWithPublishedProject",
      COUNT(DISTINCT p."ownerId") FILTER (WHERE p.status = 'ARCHIVED')::int AS "ownersWithArchivedProject"
    FROM "Project" p
  `;

  return (
    rows[0] ?? {
      ownersWithProject: 0,
      ownersWithPublishedProject: 0,
      ownersWithArchivedProject: 0,
    }
  );
}

async function getAveragePublishLeadTimeDays() {
  const rows = await prisma.$queryRaw<AveragePublishLeadRow[]>`
    SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400)::float8 AS "avgDays"
    FROM "Project"
    WHERE status = 'PUBLISHED'
  `;

  return rows[0]?.avgDays ?? null;
}

async function getInvalidNeedsCount() {
  try {
    const rows = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM "ProjectNeed" n
      WHERE
        (n.type = 'FINANCIAL' AND n.amount IS NULL)
        OR (n.type = 'SKILL' AND COALESCE(n."requiredCount", 0) < 1)
        OR (n.type = 'MATERIAL' AND (n.description IS NULL OR btrim(n.description) = ''))
        OR (n.type = 'PARTNERSHIP' AND (n.description IS NULL OR btrim(n.description) = ''))
    `;

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getAllocationAnomalies(limit = 5) {
  try {
    const rows = await prisma.$queryRaw<AllocationAnomalyRow[]>`
      SELECT
        p.id,
        p.title,
        (
          COALESCE(p."ownerEquityPercent", 0)
          + COALESCE(SUM(COALESCE(n."equityShare", 0)), 0)
        )::int AS "allocatedShare"
      FROM "Project" p
      LEFT JOIN "ProjectNeed" n ON n."projectId" = p.id
      GROUP BY p.id, p.title, p."ownerEquityPercent"
      HAVING (
        COALESCE(p."ownerEquityPercent", 0)
        + COALESCE(SUM(COALESCE(n."equityShare", 0)), 0)
      ) > 100
      ORDER BY "allocatedShare" DESC
      LIMIT ${limit}
    `;

    return rows;
  } catch {
    return [];
  }
}

async function getTemplatesStats() {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        total: number;
        published: number;
        featured: number;
        withAttachment: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "isPublished" = true)::int AS published,
        COUNT(*) FILTER (WHERE "isFeatured" = true)::int AS featured,
        COUNT(*) FILTER (WHERE "attachedDocumentPath" IS NOT NULL)::int AS "withAttachment"
      FROM "DocumentTemplate"
    `;

    return (
      rows[0] ?? {
        total: 0,
        published: 0,
        featured: 0,
        withAttachment: 0,
      }
    );
  } catch {
    return { total: 0, published: 0, featured: 0, withAttachment: 0 };
  }
}

async function getProjectDocumentsTotal() {
  try {
    return await prisma.projectDocument.count();
  } catch {
    return 0;
  }
}

async function getContactMessagesStats() {
  const filePath = path.join(process.cwd(), ".data", "contact-messages.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { total: 0, last7d: 0 };
    }

    const now = Date.now();
    const last7dThreshold = now - 7 * 24 * 60 * 60 * 1000;
    let last7d = 0;

    for (const row of parsed as ContactMessageRecord[]) {
      const createdAt = typeof row?.createdAt === "string" ? Date.parse(row.createdAt) : NaN;
      if (!Number.isNaN(createdAt) && createdAt >= last7dThreshold) {
        last7d += 1;
      }
    }

    return { total: parsed.length, last7d };
  } catch {
    return { total: 0, last7d: 0 };
  }
}

function buildMonthSeries(rows: Array<{ bucket: string; count: number }>, months: number) {
  const result: SeriesPoint[] = [];
  const now = new Date();
  const monthMap = new Map(rows.map((row) => [row.bucket, row.count]));

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("fr-FR", { month: "short" });
    result.push({ label, value: monthMap.get(key) ?? 0 });
  }

  return result;
}

async function getProjectsCreatedByMonth(months = 6) {
  const lookbackMonths = Math.max(1, months - 1);
  const rows = await prisma.$queryRaw<Array<{ bucket: string; count: number }>>`
    SELECT
      to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS bucket,
      COUNT(*)::int AS count
    FROM "Project"
    WHERE "createdAt" >= date_trunc('month', NOW()) - (${lookbackMonths} * INTERVAL '1 month')
    GROUP BY 1
    ORDER BY 1
  `;

  return buildMonthSeries(rows, months);
}

export default async function DashboardPilotagePage() {
  await requireCurrentUserPermission(RBAC_PERMISSIONS.DASHBOARD_PILOTAGE_READ);

  const [
    profilesCounts,
    funnel,
    avgPublishLeadDays,
    invalidNeedsCount,
    allocationAnomalies,
    contactStats,
    totalProjects,
    statusGroups,
    capitalAggregate,
    needsTotal,
    needsOpen,
    openNeedsByType,
    filledFinancialNeedsAggregate,
    ownerContributionAggregate,
    staleProjectsRows,
    criticalFinancialNeedsCount,
    publishedMissingDataCount,
    templatesStats,
    projectDocumentsTotal,
    monthlyProjectSeries,
    publishedOpenByNeedsCount,
    publishedClosedByNeedsCount,
  ] = await Promise.all([
    getProfilesCounts(),
    getFunnelStats(),
    getAveragePublishLeadTimeDays(),
    getInvalidNeedsCount(),
    getAllocationAnomalies(),
    getContactMessagesStats(),
    prisma.project.count(),
    prisma.project.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.project.aggregate({
      _sum: { totalCapital: true },
    }),
    prisma.projectNeed.count(),
    prisma.projectNeed.count({
      where: { isFilled: false },
    }),
    prisma.projectNeed.groupBy({
      by: ["type"],
      where: { isFilled: false },
      _count: { _all: true },
    }),
    prisma.projectNeed.aggregate({
      where: { isFilled: true, type: "FINANCIAL" },
      _sum: { amount: true },
    }),
    prisma.project.aggregate({
      _sum: { ownerContribution: true },
    }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "Project"
      WHERE status <> 'ARCHIVED'
        AND "updatedAt" <= NOW() - INTERVAL '30 days'
    `,
    prisma.projectNeed.count({
      where: {
        isFilled: false,
        type: "FINANCIAL",
        amount: { gte: 10_000_000 },
      },
    }),
    prisma.project.count({
      where: {
        status: "PUBLISHED",
        OR: [
          { totalCapital: null },
          { summary: { equals: "" } },
          { description: { equals: "" } },
        ],
      },
    }),
    getTemplatesStats(),
    getProjectDocumentsTotal(),
    getProjectsCreatedByMonth(6),
    prisma.project.count({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        needs: {
          some: {
            isFilled: false,
          },
        },
      },
    }),
    prisma.project.count({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        needs: {
          none: {
            isFilled: false,
          },
        },
      },
    }),
  ]);

  const publishedProjects =
    statusGroups.find((group) => group.status === "PUBLISHED")?._count._all ?? 0;
  const draftProjects =
    statusGroups.find((group) => group.status === "DRAFT")?._count._all ?? 0;
  const archivedProjects =
    statusGroups.find((group) => group.status === "ARCHIVED")?._count._all ?? 0;

  const filledNeeds = Math.max(0, needsTotal - needsOpen);
  const needsFillRate = needsTotal > 0 ? (filledNeeds / needsTotal) * 100 : 0;

  const totalCapitalSought = capitalAggregate._sum.totalCapital ?? 0;
  const ownerContributionTotal = ownerContributionAggregate._sum.ownerContribution ?? 0;
  const financialAmountFilled = filledFinancialNeedsAggregate._sum.amount ?? 0;
  const staleProjectsCount = staleProjectsRows[0]?.count ?? 0;
  const totalCapitalMobilized = ownerContributionTotal + financialAmountFilled;
  const capitalCoverage =
    totalCapitalSought > 0 ? (totalCapitalMobilized / totalCapitalSought) * 100 : 0;

  const publicationRate =
    totalProjects > 0 ? (publishedProjects / totalProjects) * 100 : 0;
  const draftToPublishedRate =
    draftProjects + publishedProjects > 0
      ? (publishedProjects / (draftProjects + publishedProjects)) * 100
      : 0;
  const ownerActivationRate =
    profilesCounts.total > 0
      ? (funnel.ownersWithProject / profilesCounts.total) * 100
      : 0;
  const qualityAlerts =
    invalidNeedsCount + publishedMissingDataCount + allocationAnomalies.length;

  const openNeedTypeMap = new Map(
    openNeedsByType.map((row) => [row.type, row._count._all])
  );
  const statusChartItems = [
    { label: "Brouillons", value: draftProjects, color: "#f59e0b" },
    { label: "Publiés", value: publishedProjects, color: "#10b981" },
    { label: "Clôturés", value: archivedProjects, color: "#64748b" },
  ];
  const needsTypeChartItems = [
    { label: "FINANCIAL", value: openNeedTypeMap.get("FINANCIAL") ?? 0, color: "#6d5efc" },
    { label: "SKILL", value: openNeedTypeMap.get("SKILL") ?? 0, color: "#0ea5e9" },
    { label: "MATERIAL", value: openNeedTypeMap.get("MATERIAL") ?? 0, color: "#10b981" },
    { label: "PARTNERSHIP", value: openNeedTypeMap.get("PARTNERSHIP") ?? 0, color: "#f59e0b" },
  ];
  const publishedProjectsSplitItems = [
    {
      label: "Ouverts (besoins restants)",
      value: publishedOpenByNeedsCount,
      color: "#10b981",
    },
    {
      label: "Fermés (besoins validés)",
      value: publishedClosedByNeedsCount,
      color: "#64748b",
    },
  ];
  const funnelSteps = [
    { label: "Inscrits", value: profilesCounts.total },
    { label: "Inscrits avec projet", value: funnel.ownersWithProject },
    { label: "Inscrits avec projet publié", value: funnel.ownersWithPublishedProject },
    { label: "Inscrits avec projet clôturé", value: funnel.ownersWithArchivedProject },
  ];

  const requiredEnvKeys = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_ENDPOINT",
  ] as const;
  const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Pilotage</p>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Business + Ops + Qualité</h1>
        <p className="dashboard-faint mt-2 text-sm">
          Vue admin structurée en 7 blocs: KPIs exécutifs, funnel, santé marketplace,
          conformité, templates, support et monitoring technique.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Utilisateurs"
          value={String(profilesCounts.total)}
          hint={`+${profilesCounts.last7d} sur 7 jours`}
          tone="success"
        />
        <MetricCard
          label="Projets"
          value={String(totalProjects)}
          hint={`${publishedProjects} publiés`}
        />
        <MetricCard
          label="Taux publication"
          value={formatPercent(publicationRate)}
          hint={`${draftProjects} brouillons en attente`}
          tone={publicationRate >= 40 ? "success" : "warning"}
        />
        <MetricCard
          label="Capital mobilisé"
          value={formatMoney(totalCapitalMobilized)}
          hint={`${formatPercent(capitalCoverage)} couvert`}
        />
        <MetricCard
          label="Alertes qualité"
          value={String(qualityAlerts)}
          hint="incohérences à corriger"
          tone={qualityAlerts > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <PilotageDonutChart
          title="Répartition des projets par statut"
          items={statusChartItems}
          totalLabel="projets"
        />
        <PilotageDonutChart
          title="Publiés: ouverts vs fermés (selon besoins)"
          items={publishedProjectsSplitItems}
          totalLabel="publiés"
          variant="pie"
        />
        <PilotageDonutChart
          title="Besoins ouverts par type"
          items={needsTypeChartItems}
          totalLabel="besoins"
        />
        <PilotageProjectCreationChart initialPoints={monthlyProjectSeries} initialMonths={6} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Business</p>
          <h2 className="mt-2 text-lg font-semibold">Performance business</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Traction globale, conversion des projets et couverture financière.
          </p>
          <div className="mt-4">
            <PilotageBusinessPerformanceCharts
              totalCapitalSought={totalCapitalSought}
              ownerContributionTotal={ownerContributionTotal}
              financialAmountFilled={financialAmountFilled}
              publicationRate={publicationRate}
              draftToPublishedRate={draftToPublishedRate}
              capitalCoverage={capitalCoverage}
              needsFillRate={needsFillRate}
              ownerActivationRate={ownerActivationRate}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Nouveaux inscrits (30j)"
              value={String(profilesCounts.last30d)}
            />
            <MetricCard
              label="Temps moyen vers publication"
              value={formatDays(avgPublishLeadDays)}
            />
          </div>
        </div>

        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Acquisition</p>
          <h2 className="mt-2 text-lg font-semibold">Funnel plateforme</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Parcours utilisateur de l&apos;inscription à la publication/clôture projet.
          </p>
          <div className="mt-4">
            <PilotageFunnelChart title="Entonnoir utilisateurs" steps={funnelSteps} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Activation compte → projet"
              value={formatPercent(ownerActivationRate)}
            />
            <MetricCard
              label="Inscrits avec projet publié"
              value={String(funnel.ownersWithPublishedProject)}
              tone="success"
            />
            <MetricCard
              label="Inscrits avec projet clôturé"
              value={String(funnel.ownersWithArchivedProject)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Opérations</p>
          <h2 className="mt-2 text-lg font-semibold">Santé du marketplace</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Disponibilité des besoins et suivi des projets à risque d&apos;inertie.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Besoins ouverts" value={String(needsOpen)} />
            <MetricCard
              label="Besoins comblés"
              value={String(filledNeeds)}
              hint={`${formatPercent(needsFillRate)} du total`}
              tone={needsFillRate >= 50 ? "success" : "warning"}
            />
            <MetricCard
              label="Projets inactifs (+30 jours)"
              value={String(staleProjectsCount)}
              tone={staleProjectsCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Besoins financiers critiques"
              value={String(criticalFinancialNeedsCount)}
              tone={criticalFinancialNeedsCount > 0 ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Qualité</p>
          <h2 className="mt-2 text-lg font-semibold">Conformité des données</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Détection des incohérences fonctionnelles et des dossiers incomplets.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Besoins invalides"
              value={String(invalidNeedsCount)}
              tone={invalidNeedsCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Projets publiés incomplets"
              value={String(publishedMissingDataCount)}
              tone={publishedMissingDataCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Anomalies allocation > 100%"
              value={String(allocationAnomalies.length)}
              tone={allocationAnomalies.length > 0 ? "warning" : "success"}
            />
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/pilotage/incoherences"
              className="dashboard-btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            >
              Voir la liste détaillée
            </Link>
          </div>

          {allocationAnomalies.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-background/50 p-3">
              <p className="dashboard-faint mb-2 text-xs uppercase tracking-wide">
                Priorité de correction
              </p>
              <div className="space-y-2 text-sm">
                {allocationAnomalies.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.title}</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-300">
                      {row.allocatedShare}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Contenu</p>
          <h2 className="mt-2 text-lg font-semibold">Documents & templates</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Production de contenu, publication et couverture documentaire.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Templates total" value={String(templatesStats.total)} />
            <MetricCard label="Templates publiés" value={String(templatesStats.published)} />
            <MetricCard label="Templates mis en avant" value={String(templatesStats.featured)} />
            <MetricCard
              label="Templates avec fichier joint"
              value={String(templatesStats.withAttachment)}
            />
            <MetricCard label="Documents projets" value={String(projectDocumentsTotal)} />
            <MetricCard
              label="Usage interactif"
              value="N/A"
              hint="tracking à instrumenter"
              tone="warning"
            />
          </div>
        </div>

        <div className="dashboard-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Support</p>
          <h2 className="mt-2 text-lg font-semibold">Relation utilisateur</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Volume d&apos;échanges entrants et capacité de traitement support.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Messages reçus (total)" value={String(contactStats.total)} />
            <MetricCard label="Messages reçus (7 jours)" value={String(contactStats.last7d)} />
            <MetricCard
              label="Temps moyen de réponse"
              value="N/A"
              hint="table tickets non branchée"
              tone="warning"
            />
            <MetricCard
              label="Tickets ouverts/fermés"
              value="N/A"
              hint="table tickets non branchée"
              tone="warning"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Technique</p>
        <h2 className="mt-2 text-lg font-semibold">Monitoring technique</h2>
        <p className="dashboard-faint mt-1 text-sm">
          Contrôles de disponibilité infra et état de configuration critique.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Prisma/DB"
            value="OK"
            hint="connexion active"
            tone="success"
          />
          <MetricCard
            label="Variables critiques manquantes"
            value={String(missingEnvKeys.length)}
            hint={
              missingEnvKeys.length > 0
                ? missingEnvKeys.join(", ")
                : "configuration complète"
            }
            tone={missingEnvKeys.length > 0 ? "warning" : "success"}
          />
          <MetricCard
            label="Erreurs applicatives"
            value="N/A"
            hint="instrumentation à brancher"
            tone="warning"
          />
          <MetricCard
            label="Performance API"
            value="N/A"
            hint="tracing à activer"
            tone="warning"
          />
        </div>
      </div>

    </section>
  );
}
