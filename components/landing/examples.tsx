import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

const projectExamples = [
  {
    title: "Pisciculture",
    location: "Brazzaville Nord",
    price: "750 000 FCFA",
    cadence: "capital total",
    description: "Projet aquacole avec bassin déjà identifié et plan de vente local.",
    surface: "1 200 m²",
    volume: "45 000 L",
    production: "1.8 t / cycle",
    progress: 62,
    image: "/landing/project-1.svg",
  },
  {
    title: "Transformation de manioc",
    location: "Pointe-Noire",
    price: "1 200 000 FCFA",
    cadence: "capital total",
    description: "Unité de transformation avec local équipé et réseau de distribution.",
    surface: "1 650 m²",
    volume: "3 t / jour",
    production: "2 400 sachets / mois",
    progress: 48,
    image: "/landing/project-2.svg",
  },
  {
    title: "Élevage de poules pondeuses",
    location: "Bouenza",
    price: "900 000 FCFA",
    cadence: "capital total",
    description: "Terrain disponible avec expertise élevage et débouchés assurés.",
    surface: "2 100 m²",
    volume: "1 500 poules",
    production: "1 200 oeufs / jour",
    progress: 100,
    image: "/landing/project-3.svg",
  },
];

export function Examples() {
  return (
    <Section id="exemples" className="bg-surface-accent/70">
      <Container>
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">Exemples de projets</p>
            <h2 className="mt-2 text-3xl font-semibold text-text-primary">
              Des projets concrets, des besoins précis.
            </h2>
          </div>
          <Link href="/projects" className={buttonVariants({ variant: "secondary" })}>
            Voir tout
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {projectExamples.map((project) => {
            const isClosed = project.progress >= 100;
            const statusLabel = isClosed ? "Fermé" : "Ouvert";

            return (
              <Card
                key={project.title}
                className="flex h-full flex-col overflow-hidden border-border/60 bg-surface/90 p-0 shadow-medium"
              >
                <div
                  className="h-44 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${project.image})` }}
                />
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {project.price}{" "}
                      <span className="text-sm font-medium text-text-secondary">
                        {project.cadence}
                      </span>
                    </p>
                    <p className="mt-2 text-base font-semibold text-text-primary">
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {project.description}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                      {project.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M4 10h16" />
                        <path d="M4 14h16" />
                        <path d="M7 10V6h10v4" />
                      </svg>
                      {project.surface}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M5 12h14" />
                        <path d="M7 12V7a5 5 0 0 1 10 0v5" />
                        <path d="M7 17h10" />
                      </svg>
                      {project.volume}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M4 4h6v6H4z" />
                        <path d="M14 4h6v6h-6z" />
                        <path d="M4 14h6v6H4z" />
                      </svg>
                      {project.production}
                    </span>
                  </div>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                      <span>Objectif atteint</span>
                      <Badge
                        className={
                          isClosed
                            ? "border-rose-200/60 bg-rose-500/10 text-rose-500"
                            : "border-emerald-200/60 bg-emerald-500/10 text-emerald-600"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border/60">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-secondary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-text-secondary">
                      {project.progress}% de financement sécurisé
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
