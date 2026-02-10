import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/projects/ProjectBadge";
import ProjectImageGallery from "@/components/projects/ProjectImageGallery";
import { ProjectContactActions } from "@/components/projects/ProjectContactActions";

type Props = {
  params: { id: string };
};

const categoryLabels: Record<string, string> = {
  AGRIBUSINESS: "Agribusiness",
  TECH: "Tech",
  HEALTH: "Santé",
  EDUCATION: "Éducation",
  INFRASTRUCTURE: "Infrastructure",
  OTHER: "Autre",
};

const equityLabels: Record<string, string> = {
  NONE: "Sans equity",
  EQUITY: "Part en capital",
  REVENUE_SHARE: "Partage de revenus",
};

const legalFormLabels: Record<string, string> = {
  SARL: "SARL",
  SA: "SA",
  AUTOENTREPRENEUR: "Auto-entrepreneur",
  OTHER: "Autre",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Public",
  PRIVATE: "Privé",
};

const getProjectById = cache(async (projectId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: { needs: true },
  });
});

function formatMoney(amount?: number | null) {
  if (!amount && amount !== 0) return "—";
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = params ? await params : undefined;
  const id = resolvedParams?.id;

  if (!id) {
    return {
      title: "Projet | Mon partenaire",
      description: "Découvrez des projets entrepreneuriaux en recherche de partenaires.",
      robots: { index: false, follow: false },
    };
  }

  const project = await getProjectById(id);

  if (!project) {
    return {
      title: "Projet introuvable | Mon partenaire",
      description: "Ce projet n'est pas disponible.",
      robots: { index: false, follow: false },
    };
  }

  const categoryLabel = categoryLabels[project.category] ?? project.category;
  const title = `${project.title} | ${categoryLabel} | Mon partenaire`;
  const description = truncateText(
    project.summary?.trim() || `Projet ${categoryLabel} à ${project.city}.`,
    160
  );

  const baseSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const canonicalPath = `/projects/${project.id}`;
  const canonicalUrl = baseSiteUrl ? `${baseSiteUrl}${canonicalPath}` : canonicalPath;
  const openGraphImage = baseSiteUrl
    ? `${baseSiteUrl}/landing/project-1.svg`
    : "/landing/project-1.svg";

  return {
    title,
    description,
    keywords: [
      project.title,
      categoryLabel,
      project.city,
      "partenariat",
      "investissement",
      "Mon partenaire",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: "fr_FR",
      siteName: "Mon partenaire",
      url: canonicalUrl,
      images: [
        {
          url: openGraphImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [openGraphImage],
    },
    robots:
      project.visibility === "PUBLIC"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  const resolvedParams = params ? await params : undefined;
  const id = resolvedParams?.id;

  if (!id) {
    redirect("/projects");
  }

  const project = await getProjectById(id);

  if (!project) {
    redirect("/projects");
  }

  const images = [
    "/landing/project-1.svg",
    "/landing/project-2.svg",
    "/landing/project-3.svg",
  ];

  const totalNeeds = project.needs.length;
  const openNeeds = project.needs.filter((need) => !need.isFilled);
  const filledNeeds = totalNeeds - openNeeds.length;
  const progressPercent =
    totalNeeds > 0 ? Math.round((filledNeeds / totalNeeds) * 100) : 0;

  const financialNeeds = project.needs.filter((need) => need.type === "FINANCIAL");
  const skillNeeds = project.needs.filter((need) => need.type === "SKILL");

  const totalFinancialNeed = openNeeds
    .filter((need) => need.type === "FINANCIAL")
    .reduce((sum, need) => sum + (need.amount ?? 0), 0);

  const totalCapital = project.totalCapital ?? 0;
  const ownerContribution = project.ownerContribution ?? 0;
  const remainingCapital = Math.max(totalCapital - ownerContribution, 0);
  const ownerCoverage =
    totalCapital > 0
      ? Math.min(100, Math.round((ownerContribution / totalCapital) * 100))
      : 0;

  const statusTone =
    project.status === "PUBLISHED"
      ? "bg-emerald-600/10 text-emerald-600"
      : project.status === "ARCHIVED"
        ? "bg-slate-500/10 text-slate-600"
        : "bg-amber-500/10 text-amber-700";

  const userMetaName = session.user.user_metadata?.full_name;
  const initialContactName = typeof userMetaName === "string" ? userMetaName : undefined;
  const initialContactEmail = session.user.email;

  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <Header />

      <main className="py-8">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
            >
              ← Retour aux projets
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius)] border border-border/60 bg-surface/75 p-5 shadow-soft">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <ProjectBadge>
                  {categoryLabels[project.category] ?? project.category}
                </ProjectBadge>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}
                >
                  {statusLabels[project.status] ?? project.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  {visibilityLabels[project.visibility] ?? project.visibility}
                </span>
              </div>

              <h1 className="text-3xl font-semibold md:text-4xl">{project.title}</h1>
              <p className="max-w-3xl text-base text-text-secondary md:text-lg">
                {project.summary}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                <span>
                  {project.city}, {project.country}
                </span>
                <span>Créé le {formatDate(project.createdAt)}</span>
                <span>Mise à jour le {formatDate(project.updatedAt)}</span>
              </div>
            </div>

            <div className="grid min-w-[250px] grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Besoins ouverts
                </p>
                <p className="mt-1 text-lg font-semibold">{openNeeds.length}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Progression
                </p>
                <p className="mt-1 text-lg font-semibold">{progressPercent}%</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Capital visé
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {totalCapital > 0
                    ? `${(totalCapital / 1_000_000).toFixed(1)}M`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Apport fondateur
                </p>
                <p className="mt-1 text-lg font-semibold">{ownerCoverage}%</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ProjectImageGallery images={images} title={project.title} />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <Card className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">À propos du projet</h2>
                  <span className="text-xs text-text-secondary">
                    ID: {project.id.slice(0, 8)}
                  </span>
                </div>
                <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
                  {project.description
                    .split("\n")
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => (
                      <p key={`${project.id}-paragraph-${index}`}>{paragraph}</p>
                    ))}
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    Forme juridique
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {project.legalForm
                      ? legalFormLabels[project.legalForm] ?? project.legalForm
                      : "—"}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    Modèle de partenariat
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {equityLabels[project.equityModel] ?? project.equityModel}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    Entreprise créée
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {project.companyCreated ? "Oui" : "Non"}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    Besoins comblés
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {filledNeeds}/{totalNeeds}
                  </p>
                </Card>
              </div>

              <Card className="space-y-5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Plan de financement</h2>
                  <span className="text-xs text-text-secondary">
                    Répartition actuelle
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/50 bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">
                      Capital total
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {formatMoney(project.totalCapital)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">
                      Apport porteur
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {formatMoney(project.ownerContribution)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">
                      Reste à mobiliser
                    </p>
                    <p className="mt-2 text-base font-semibold text-accent">
                      {totalCapital > 0 ? formatMoney(remainingCapital) : "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Couverture par le porteur
                    </span>
                    <span className="font-semibold">{ownerCoverage}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-border/40">
                    <div
                      className="h-3 rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${ownerCoverage}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-surface-accent/60 p-4 text-sm text-text-secondary">
                  <p>
                    Besoins financiers ouverts estimés:{" "}
                    <span className="font-semibold text-text-primary">
                      {formatMoney(totalFinancialNeed)}
                    </span>
                  </p>
                </div>
              </Card>

              <Card className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Besoins du projet</h2>
                  <span className="text-sm text-text-secondary">
                    {openNeeds.length} ouverts
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Progression des besoins
                    </span>
                    <span className="font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-border/40">
                    <div
                      className="h-3 rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {project.needs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                      Aucun besoin n&apos;est encore publié pour ce projet.
                    </div>
                  ) : (
                    [...project.needs]
                      .sort((a, b) => Number(a.isFilled) - Number(b.isFilled))
                      .map((need) => (
                        <div
                          key={need.id}
                          className="rounded-lg border border-border/50 bg-background/60 p-4 transition-colors hover:bg-surface"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-text-primary">
                                  {need.title}
                                </p>
                                <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                  {need.type === "FINANCIAL" ? "Financier" : "Compétence"}
                                </span>
                                {need.isFilled ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                    Comblé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Ouvert
                                  </span>
                                )}
                              </div>

                              {need.description ? (
                                <p className="text-sm text-text-secondary">
                                  {need.description}
                                </p>
                              ) : null}

                              {need.skillTags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {need.skillTags.map((tag) => (
                                    <span
                                      key={`${need.id}-${tag}`}
                                      className="inline-flex items-center rounded-full bg-surface-accent px-2.5 py-1 text-xs text-text-secondary"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-text-primary">
                                {need.amount ? formatMoney(need.amount) : need.type}
                              </p>
                              {need.equityShare ? (
                                <p className="mt-1 text-xs text-text-secondary">
                                  Jusqu&apos;à {need.equityShare}%
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="space-y-4 border-accent/20 bg-accent/5 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    Capital recherché
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-accent">
                    {totalCapital > 0
                      ? `${(totalCapital / 1_000_000).toFixed(1)}M`
                      : "—"}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatMoney(project.totalCapital)}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Reste à mobiliser</span>
                    <span className="font-semibold text-text-primary">
                      {totalCapital > 0 ? formatMoney(remainingCapital) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Besoins financiers</span>
                    <span className="font-semibold text-text-primary">
                      {financialNeeds.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Besoins compétences</span>
                    <span className="font-semibold text-text-primary">
                      {skillNeeds.length}
                    </span>
                  </div>
                </div>

                <ProjectContactActions
                  projectId={project.id}
                  projectTitle={project.title}
                  projectCity={project.city}
                  initialName={initialContactName}
                  initialEmail={initialContactEmail}
                />
              </Card>

              <Card className="space-y-3 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  Signaux de confiance
                </h2>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>• Informations projet structurées</p>
                  <p>• Répartition financière affichée</p>
                  <p>• Besoins détaillés et horodatés</p>
                </div>
              </Card>

              <Card className="space-y-3 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  Infos rapides
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Ville</span>
                    <span className="font-medium">{project.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Catégorie</span>
                    <span className="font-medium">
                      {categoryLabels[project.category] ?? project.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Modèle</span>
                    <span className="font-medium">
                      {equityLabels[project.equityModel] ?? project.equityModel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Statut</span>
                    <span className="font-medium">
                      {statusLabels[project.status] ?? project.status}
                    </span>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
