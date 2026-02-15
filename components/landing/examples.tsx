import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getHomeProjectExamples } from "@/src/lib/projects";
import { getI18n } from "@/src/i18n";

const FALLBACK_IMAGES = ["/landing/project-1.svg", "/landing/project-2.svg", "/landing/project-3.svg"];

export async function Examples() {
  const messages = await getI18n();
  const t = messages.landing.examples;

  // Selection logic:
  // 1) Prioritize published/public projects with at least one open need (non-clotures).
  // 2) Complete with the most recent published/public projects if needed, up to 3 cards.
  const projectExamples = await getHomeProjectExamples(3);

  return (
    <Section id="exemples" className="bg-surface-accent/70">
      <Container>
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-text-primary">
              {t.title}
            </h2>
          </div>
          <Link href="/projects" className={buttonVariants({ variant: "secondary" })}>
            {t.viewAll}
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {projectExamples.map((project, index) => {
            const image = project.coverImageUrl ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

            return (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                summary={project.summary}
                category={project.category}
                city={project.city}
                totalCapital={project.totalCapital}
                remainingNeeds={project.remainingNeeds}
                needTypes={project.needTypes}
                image={image}
                progress={project.equityAllocationPercent}
              />
            );
          })}
          {projectExamples.length === 0 ? (
            <Card className="col-span-full border-border/60 bg-surface/90 p-6 text-sm text-text-secondary">
              {t.noProjects}
            </Card>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
