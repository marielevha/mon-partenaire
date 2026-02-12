import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProjectStatusAction } from "@/app/dashboard/actions";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mes projets | Dashboard | Mon partenaire",
  description: "Gérez tous vos projets depuis le dashboard.",
};

const categoryLabels: Record<string, string> = {
  AGRIBUSINESS: "Agribusiness",
  TECH: "Tech",
  HEALTH: "Santé",
  EDUCATION: "Éducation",
  INFRASTRUCTURE: "Infrastructure",
  OTHER: "Autre",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

const statusClasses: Record<string, string> = {
  DRAFT:
    "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200",
  PUBLISHED:
    "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200",
  ARCHIVED:
    "border border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/20 dark:text-slate-300",
};

type DashboardNeed = {
  id: string;
  isFilled: boolean;
};

type DashboardProject = {
  id: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  status: string;
  totalCapital: number | null;
  updatedAt: Date;
  needs: DashboardNeed[];
};

type DashboardProjectsPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

function formatMoney(amount?: number | null) {
  if (!amount && amount !== 0) return "—";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createProjectsHref(page: number, limit: number) {
  return `/dashboard/projects?page=${page}&limit=${limit}`;
}

export default async function DashboardProjectsPage({
  searchParams,
}: DashboardProjectsPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageParam =
    typeof resolvedSearchParams?.page === "string"
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;
  const limitParam =
    typeof resolvedSearchParams?.limit === "string"
      ? Number.parseInt(resolvedSearchParams.limit, 10)
      : 10;

  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const itemsPerPage = ITEMS_PER_PAGE_OPTIONS.includes(limitParam) ? limitParam : 10;

  const where = {
    ownerId: session.user.id,
  };

  const totalProjects = await prisma.project.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalProjects / itemsPerPage));

  if (currentPage > totalPages) {
    redirect(createProjectsHref(totalPages, itemsPerPage));
  }

  const projects = (await prisma.project.findMany({
    where,
    include: {
      needs: {
        select: {
          id: true,
          isFilled: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  })) as DashboardProject[];

  const statusCounts = await prisma.project.groupBy({
    by: ["status"],
    where,
    _count: {
      _all: true,
    },
  });

  const publishedProjects =
    statusCounts.find((item) => item.status === "PUBLISHED")?._count._all ?? 0;
  const draftProjects =
    statusCounts.find((item) => item.status === "DRAFT")?._count._all ?? 0;
  const archivedProjects =
    statusCounts.find((item) => item.status === "ARCHIVED")?._count._all ?? 0;

  const visiblePageCount = 5;
  let startPage = Math.max(1, currentPage - Math.floor(visiblePageCount / 2));
  const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
  if (endPage - startPage + 1 < visiblePageCount) {
    startPage = Math.max(1, endPage - visiblePageCount + 1);
  }
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">Mes projets</h1>
            <p className="dashboard-faint mt-2 max-w-2xl text-sm">
              Gérez l&apos;ensemble de vos projets, suivez leur progression et mettez
              à jour les statuts.
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="dashboard-btn-primary inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            Créer un projet
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Projets totaux</p>
          <p className="mt-2 text-2xl font-semibold">{totalProjects}</p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Publiés</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {publishedProjects}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Brouillons</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-200">
            {draftProjects}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Archivés</p>
          <p className="mt-2 text-2xl font-semibold">{archivedProjects}</p>
        </div>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        {projects.length === 0 ? (
          <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
            Aucun projet pour le moment.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {projects.map((project) => {
                const totalNeedsByProject = project.needs.length;
                const filledNeedsByProject = project.needs.filter((need) => need.isFilled).length;
                const projectProgress =
                  totalNeedsByProject > 0
                    ? Math.round((filledNeedsByProject / totalNeedsByProject) * 100)
                    : 0;

                return (
                  <div key={project.id} className="dashboard-panel-soft rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">{project.title}</p>
                          <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-200">
                            {categoryLabels[project.category] ?? project.category}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[project.status] ?? "border border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/20 dark:text-slate-300"}`}
                          >
                            {statusLabels[project.status] ?? project.status}
                          </span>
                        </div>

                        <p className="dashboard-muted max-w-2xl text-sm">{project.summary}</p>

                        <div className="dashboard-faint flex flex-wrap items-center gap-4 text-xs">
                          <span>{project.city}</span>
                          <span>Mis à jour le {formatDate(project.updatedAt)}</span>
                          <span>Capital: {formatMoney(project.totalCapital)}</span>
                        </div>
                      </div>

                      <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="dashboard-faint flex items-center justify-between text-xs">
                          <span>Progression besoins</span>
                          <span>{projectProgress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-300/80 dark:bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${projectProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-divider mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Modifier
                        </Link>
                        <Link
                          href={`/projects/${project.id}`}
                          className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Voir page publique
                        </Link>
                      </div>

                      <form action={updateProjectStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="projectId" value={project.id} />
                        <select
                          name="status"
                          defaultValue={project.status}
                          className="dashboard-input rounded-md px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                        >
                          <option value="DRAFT">Brouillon</option>
                          <option value="PUBLISHED">Publié</option>
                          <option value="ARCHIVED">Archivé</option>
                        </select>
                        <button
                          type="submit"
                          className="dashboard-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Mettre à jour
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-divider flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
              <form method="get" className="flex items-center gap-2">
                <input type="hidden" name="page" value="1" />
                <label className="dashboard-faint text-sm" htmlFor="limit">
                  Éléments par page
                </label>
                <select
                  id="limit"
                  name="limit"
                  defaultValue={String(itemsPerPage)}
                  className="dashboard-input rounded-md px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Appliquer
                </button>
              </form>

              {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={createProjectsHref(currentPage - 1, itemsPerPage)}
                      className="dashboard-btn-secondary flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors"
                    >
                      ←
                    </Link>
                  ) : (
                    <div className="dashboard-btn-secondary dashboard-faint flex h-9 w-9 items-center justify-center rounded-md text-sm opacity-60">
                      ←
                    </div>
                  )}

                  {visiblePages[0] > 1 ? (
                    <>
                      <Link
                        href={createProjectsHref(1, itemsPerPage)}
                        className="dashboard-btn-secondary flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors"
                      >
                        1
                      </Link>
                      {visiblePages[0] > 2 ? (
                        <span className="dashboard-faint px-1">...</span>
                      ) : null}
                    </>
                  ) : null}

                  {visiblePages.map((page) => (
                    <Link
                      key={page}
                      href={createProjectsHref(page, itemsPerPage)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "dashboard-btn-primary border-transparent"
                          : "dashboard-btn-secondary"
                      }`}
                    >
                      {page}
                    </Link>
                  ))}

                  {visiblePages[visiblePages.length - 1] < totalPages ? (
                    <>
                      {visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
                        <span className="dashboard-faint px-1">...</span>
                      ) : null}
                      <Link
                        href={createProjectsHref(totalPages, itemsPerPage)}
                        className="dashboard-btn-secondary flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors"
                      >
                        {totalPages}
                      </Link>
                    </>
                  ) : null}

                  {currentPage < totalPages ? (
                    <Link
                      href={createProjectsHref(currentPage + 1, itemsPerPage)}
                      className="dashboard-btn-secondary flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors"
                    >
                      →
                    </Link>
                  ) : (
                    <div className="dashboard-btn-secondary dashboard-faint flex h-9 w-9 items-center justify-center rounded-md text-sm opacity-60">
                      →
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
