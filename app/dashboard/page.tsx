import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/projects/ProjectBadge";
import { updateProjectStatusAction } from "@/app/dashboard/actions";

export const metadata: Metadata = {
  title: "Dashboard | Mon partenaire",
  description: "Créez et suivez vos projets entrepreneuriaux.",
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
  DRAFT: "bg-amber-500/10 text-amber-700",
  PUBLISHED: "bg-emerald-600/10 text-emerald-600",
  ARCHIVED: "bg-slate-500/10 text-slate-600",
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

type DashboardPageProps = {
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

function createDashboardHref(page: number, limit: number) {
  return `/dashboard?page=${page}&limit=${limit}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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
    redirect(createDashboardHref(totalPages, itemsPerPage));
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

  const capitalAggregate = await prisma.project.aggregate({
    where,
    _sum: {
      totalCapital: true,
    },
  });
  const totalCapital = capitalAggregate._sum.totalCapital ?? 0;

  const openNeeds = await prisma.projectNeed.count({
    where: {
      isFilled: false,
      project: {
        ownerId: session.user.id,
      },
    },
  });

  const fullName =
    typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : session.user.email;

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
    <>
      <Header />

      <main className="min-h-screen bg-background py-8 text-text-primary">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-border/60 bg-surface-accent/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Espace membre</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{fullName}</p>
                </div>
                <nav className="space-y-1 p-3 text-sm">
                  <Link
                    href="/dashboard"
                    className="block rounded-md bg-accent/10 px-3 py-2 font-medium text-accent"
                  >
                    Vue d&apos;ensemble
                  </Link>
                  <Link
                    href="/dashboard/projects/new"
                    className="block rounded-md px-3 py-2 font-medium text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    Créer un projet
                  </Link>
                </nav>
              </Card>

              <Card className="space-y-2 p-4 text-sm text-text-secondary">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Checklist publication</p>
                <p>1. Finaliser le descriptif et les besoins.</p>
                <p>2. Vérifier la cohérence des montants.</p>
                <p>3. Passer le statut en &quot;Publié&quot;.</p>
              </Card>
            </aside>

            <section className="space-y-6">
              <div id="overview" className="rounded-[var(--radius)] border border-border/60 bg-surface/85 p-6 shadow-soft">
                <p className="text-sm text-text-secondary">Dashboard</p>
                <h1 className="mt-1 text-3xl font-semibold">Pilotez vos projets</h1>
                <p className="mt-2 max-w-3xl text-sm text-text-secondary">
                  Inspirez-vous d&apos;une logique admin: vue globale, création rapide et suivi opérationnel de vos projets.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Projets totaux</p>
                  <p className="mt-2 text-2xl font-semibold">{totalProjects}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Publiés</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{publishedProjects}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Brouillons</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-700">{draftProjects}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Besoins ouverts</p>
                  <p className="mt-2 text-2xl font-semibold">{openNeeds}</p>
                </Card>
              </div>

              <Card className="p-6">
                <h2 className="text-xl font-semibold">Suivi rapide</h2>
                <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                  <div className="rounded-md border border-border/60 bg-surface-accent/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Capital cumulé visé</p>
                    <p className="mt-2 text-xl font-semibold text-accent">{formatMoney(totalCapital)}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-surface-accent/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Projets archivés</p>
                    <p className="mt-2 text-xl font-semibold">{archivedProjects}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-surface-accent/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Action recommandée</p>
                    <p className="mt-2 text-text-secondary">
                      Publiez un projet avec un résumé clair et des besoins précis pour accélérer les prises de contact.
                    </p>
                  </div>
                </div>
              </Card>

              <Card id="projects-list" className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Mes projets</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Suivez l&apos;avancement et gérez le statut de publication.
                    </p>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-text-secondary">
                      Aucun projet pour le moment.
                    </p>
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
                          <div
                            key={project.id}
                            className="rounded-md border border-border/60 bg-background/70 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-semibold text-text-primary">{project.title}</p>
                                  <ProjectBadge>
                                    {categoryLabels[project.category] ?? project.category}
                                  </ProjectBadge>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[project.status] ?? "bg-slate-500/10 text-slate-600"}`}
                                  >
                                    {statusLabels[project.status] ?? project.status}
                                  </span>
                                </div>

                                <p className="max-w-2xl text-sm text-text-secondary">{project.summary}</p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                                  <span>{project.city}</span>
                                  <span>Mis à jour le {formatDate(project.updatedAt)}</span>
                                  <span>Capital: {formatMoney(project.totalCapital)}</span>
                                </div>
                              </div>

                              <div className="w-full max-w-xs space-y-2 text-sm">
                                <div className="flex items-center justify-between text-xs text-text-secondary">
                                  <span>Progression besoins</span>
                                  <span>{projectProgress}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-border/50">
                                  <div
                                    className="h-2 rounded-full bg-accent"
                                    style={{ width: `${projectProgress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-accent"
                                >
                                  Voir page publique
                                </Link>
                              </div>

                              <form action={updateProjectStatusAction} className="flex items-center gap-2">
                                <input type="hidden" name="projectId" value={project.id} />
                                <select
                                  name="status"
                                  defaultValue={project.status}
                                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                >
                                  <option value="DRAFT">Brouillon</option>
                                  <option value="PUBLISHED">Publié</option>
                                  <option value="ARCHIVED">Archivé</option>
                                </select>
                                <button
                                  type="submit"
                                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
                                >
                                  Mettre à jour
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between">
                      <form method="get" className="flex items-center gap-2">
                        <input type="hidden" name="page" value="1" />
                        <label className="text-sm text-text-secondary" htmlFor="limit">
                          Éléments par page
                        </label>
                        <select
                          id="limit"
                          name="limit"
                          defaultValue={String(itemsPerPage)}
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-accent"
                        >
                          Appliquer
                        </button>
                      </form>

                      {totalPages > 1 ? (
                        <div className="flex items-center gap-2">
                          {currentPage > 1 ? (
                            <Link
                              href={createDashboardHref(currentPage - 1, itemsPerPage)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                            >
                              ←
                            </Link>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-background text-sm text-text-secondary/50">
                              ←
                            </div>
                          )}

                          {visiblePages[0] > 1 ? (
                            <>
                              <Link
                                href={createDashboardHref(1, itemsPerPage)}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                              >
                                1
                              </Link>
                              {visiblePages[0] > 2 ? (
                                <span className="px-1 text-text-secondary">...</span>
                              ) : null}
                            </>
                          ) : null}

                          {visiblePages.map((page) => (
                            <Link
                              key={page}
                              href={createDashboardHref(page, itemsPerPage)}
                              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                                page === currentPage
                                  ? "border-accent bg-accent text-white"
                                  : "border-border bg-background text-text-primary hover:bg-surface"
                              }`}
                            >
                              {page}
                            </Link>
                          ))}

                          {visiblePages[visiblePages.length - 1] < totalPages ? (
                            <>
                              {visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
                                <span className="px-1 text-text-secondary">...</span>
                              ) : null}
                              <Link
                                href={createDashboardHref(totalPages, itemsPerPage)}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                              >
                                {totalPages}
                              </Link>
                            </>
                          ) : null}

                          {currentPage < totalPages ? (
                            <Link
                              href={createDashboardHref(currentPage + 1, itemsPerPage)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                            >
                              →
                            </Link>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-background text-sm text-text-secondary/50">
                              →
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </Card>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
