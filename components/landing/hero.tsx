import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { FeatureItem } from "@/components/landing/feature-item";
import { cn } from "@/components/ui/utils";

export function Hero() {
  return (
    <Section className="pt-12">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface px-6 py-10 shadow-medium sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-70" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="mb-4">Plateforme Congo-Brazzaville</Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                Trouver un partenaire. Construire une entreprise.
              </h1>
              <p className="mt-4 text-lg text-text-secondary">
                Publiez votre projet, structurez les apports et avancez jusqu’à la
                création légale d’une entreprise avec des partenaires fiables.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" size="lg">
                  Publier un projet
                </Button>
                <Link
                  href="#exemples"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  Trouver un projet
                </Link>
              </div>
              <div className="mt-8 grid gap-3">
                <FeatureItem
                  title="Apport financier"
                  description="Clarifiez les montants, échéances et garanties dès le départ."
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 6v12" />
                      <path d="M8 10h8" />
                      <path d="M4 6h16" />
                      <path d="M4 18h16" />
                    </svg>
                  }
                />
                <FeatureItem
                  title="Compétence"
                  description="Évaluez la valeur des expertises et des rôles opérationnels."
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3l8 5-8 5-8-5 8-5Z" />
                      <path d="M4 13l8 5 8-5" />
                      <path d="M4 18l8 5 8-5" />
                    </svg>
                  }
                />
                <FeatureItem
                  title="Répartition des parts"
                  description="Visualisez la répartition indicative et les conditions d’entrée."
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 12h18" />
                      <path d="M12 3v18" />
                      <path d="M19.5 6.5 17 4" />
                    </svg>
                  }
                />
                <FeatureItem
                  title="Statuts modèles"
                  description="Accédez aux documents juridiques validés pour accélérer la création."
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M7 3h7l5 5v13H7z" />
                      <path d="M14 3v6h6" />
                      <path d="M9 13h6" />
                      <path d="M9 17h6" />
                    </svg>
                  }
                />
              </div>
            </div>
            <Card className="relative overflow-hidden border-accent/10 bg-background/90">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-accent/10" />
              <div className="relative space-y-6">
                <div>
                  <p className="text-sm font-semibold text-accent">Nouveau</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                    Un cadre clair pour chaque partenariat.
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    Profitez d’un processus guidé pour définir la contribution de
                    chacun, formaliser les parts et préparer les documents légaux.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    "Tableau de répartition automatique",
                    "Espace de discussion sécurisé",
                    "Suivi des jalons du projet",
                    "Documents adaptés au Congo-Brazzaville",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="#comment-ca-marche"
                  className={cn(buttonVariants({ variant: "ghost" }))}
                >
                  Voir le fonctionnement
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}
