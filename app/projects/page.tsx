import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getPublicProjectsList } from "@/src/lib/projects";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectPagination } from "@/components/projects/ProjectPagination";

export default async function ProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // `searchParams` may be a Promise in newer Next.js runtimes — await it first
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const category = typeof resolvedSearchParams?.category === 'string' ? resolvedSearchParams.category : undefined;
  const needType = typeof resolvedSearchParams?.needType === 'string' ? resolvedSearchParams.needType : undefined;
  const city = typeof resolvedSearchParams?.city === 'string' ? resolvedSearchParams.city : undefined;
  const pageParam = typeof resolvedSearchParams?.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limitParam = typeof resolvedSearchParams?.limit === 'string' ? parseInt(resolvedSearchParams.limit) : 12;
  
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const itemsPerPage = [12, 24, 48, 96].includes(limitParam) ? limitParam : 12;

  const projects = await getPublicProjectsList({ category: category || null, needType: needType || null, city: city || null });

  const categories = ["AGRIBUSINESS", "TECH", "HEALTH", "EDUCATION", "INFRASTRUCTURE", "OTHER"];
  
  const totalProjects = projects.length;
  const totalPages = Math.ceil(totalProjects / itemsPerPage);
  
  // Validate currentPage and redirect if out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    redirect(`/projects?category=${category || ''}&needType=${needType || ''}&city=${city || ''}&page=${totalPages}&limit=${itemsPerPage}`);
  }
  
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedProjects = projects.slice(startIdx, endIdx);

  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-40"
      />
      <Header />
      <main className="py-12">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold text-text-primary md:text-4xl">Projets</h1>
            <p className="text-base text-text-secondary">Découvrez les projets en recherche de partenaires</p>
          </div>

          <div className="mb-8 rounded-lg border border-border bg-surface p-6 shadow-soft">
            <ProjectFilters categories={categories} />
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-12 text-center">
              <p className="text-text-secondary">Aucun projet disponible pour le moment. Revenez bientôt !</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProjects.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    summary={p.summary}
                    category={p.category}
                    city={p.city}
                    totalCapital={p.totalCapital}
                    remainingNeeds={p.remainingNeeds}
                    needTypes={p.needTypes}
                    image={p.coverImageUrl ?? `/landing/project-${(i % 3) + 1}.svg`}
                    progress={p.equityAllocationPercent}
                  />
                ))}
              </div>
              
              <ProjectPagination totalItems={totalProjects} itemsPerPage={itemsPerPage} currentPage={currentPage} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
