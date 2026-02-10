import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/projects/ProjectBadge";
import ProjectImageGallery from "@/components/projects/ProjectImageGallery";
import Link from "next/link";

type Props = {
  params: { id: string };
};

export default async function ProjectDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  const resolvedParams = params ? await params : undefined;
  const id = resolvedParams?.id;

  if (!id) {
    redirect('/projects');
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { needs: true },
  });

  if (!project) {
    redirect('/projects');
  }

  // Use placeholder images (rotate) if no images stored
  const images = [`/landing/project-1.svg`, `/landing/project-2.svg`, `/landing/project-3.svg`];

  const filledNeeds = project.needs.filter(n => n.isFilled).length;
  const totalNeeds = project.needs.length;
  const progressPercent = totalNeeds > 0 ? Math.round((filledNeeds / totalNeeds) * 100) : 0;

  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <Header />

      <main className="py-8">
        <div className="mx-auto w-full max-w-7xl px-6">
          
          {/* Header with Back link */}
          <div className="mb-6">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors">
              ← Retour aux projets
            </Link>
          </div>

          {/* Hero Section with Gallery */}
          <div className="mb-8">
            <ProjectImageGallery images={images} title={project.title} />
          </div>

          {/* Main content grid */}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left column: Description, Details, Needs */}
            <div className="space-y-6">

              {/* Title Section */}
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <ProjectBadge>{project.category}</ProjectBadge>
                  {project.status === "PUBLISHED" && (
                    <span className="inline-flex items-center rounded-full bg-green-600/10 px-2.5 py-0.5 text-xs font-medium text-green-600">Actif</span>
                  )}
                </div>
                <h1 className="text-3xl font-semibold text-text-primary">{project.title}</h1>
                <p className="mt-2 text-lg text-text-secondary">{project.summary}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{project.city}, {project.country}</span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">À propos du projet</h2>
                <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                  {project.description.split('\n').map((paragraph, i) => (
                    paragraph.trim() && <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </Card>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Forme juridique</div>
                  <div className="mt-2 text-base font-semibold text-text-primary">{project.legalForm || '—'}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Modèle equity</div>
                  <div className="mt-2 text-base font-semibold text-text-primary">{project.equityModel}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Statut</div>
                  <div className="mt-2 text-base font-semibold text-text-primary">{project.status}</div>
                </Card>
              </div>

              {/* Needs Section */}
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Besoins du projet ({totalNeeds})</h2>
                
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Besoins comblés</span>
                    <span className="font-semibold text-text-primary">{filledNeeds}/{totalNeeds}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-border/40">
                    <div 
                      className="h-3 rounded-full bg-accent transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {project.needs.map((need) => (
                    <div key={need.id} className="flex items-start justify-between gap-4 rounded-md border border-border/40 p-4 hover:bg-surface/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary">{need.title}</div>
                        {need.description && (
                          <div className="mt-1 text-xs text-text-secondary line-clamp-2">{need.description}</div>
                        )}
                        {need.skillTags && need.skillTags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {need.skillTags.map(tag => (
                              <span key={tag} className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-semibold text-text-primary">
                          {need.amount ? need.amount.toLocaleString() + ' FCFA' : need.type}
                        </div>
                        {need.isFilled && (
                          <span className="inline-flex items-center rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-medium text-green-600">
                            ✓ Comblé
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* Right column: Sidebar */}
            <aside className="space-y-4">

              {/* Capital Card */}
              <Card className="p-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">Capital total recherché</div>
                <div className="text-3xl font-semibold text-accent">{project.totalCapital ? (project.totalCapital / 1000000).toFixed(1) + 'M' : '—'}</div>
                <div className="text-xs text-text-secondary mt-1">{project.totalCapital ? project.totalCapital.toLocaleString() + ' FCFA' : '—'}</div>
                
                {project.ownerContribution && (
                  <div className="mt-4 border-t border-border/40 pt-4">
                    <div className="text-xs text-text-secondary">Apport du propriétaire</div>
                    <div className="text-lg font-semibold text-text-primary mt-1">{(project.ownerContribution / 1000000).toFixed(1)}M FCFA</div>
                  </div>
                )}
              </Card>

              {/* Stats Card */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Besoins financiers</div>
                    <div className="text-lg font-semibold text-text-primary mt-1">{project.needs.filter(n => n.type === 'FINANCIAL').length}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Besoins en compétences</div>
                    <div className="text-lg font-semibold text-text-primary mt-1">{project.needs.filter(n => n.type === 'SKILL').length}</div>
                  </div>
                </div>
              </Card>

              {/* CTA Card */}
              <Card className="p-6 bg-accent/5 border-accent/20">
                <div className="text-sm font-semibold text-text-primary mb-4">Intéressé par ce projet ?</div>
                <button className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong">
                  Contacter le propriétaire
                </button>
                <button className="mt-3 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface">
                  Ajouter en favori
                </button>
              </Card>

            </aside>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
