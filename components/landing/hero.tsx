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
    <Section className="pt-16">
      <Container>
        <div className="relative overflow-hidden rounded-[calc(var(--radius)+8px)] border border-border/60 bg-surface/85 px-6 py-12 shadow-medium backdrop-blur sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-soft-glow" />
          <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-10 h-32 w-32 rounded-full bg-accent-secondary/20 blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="mb-6 border-border/60 bg-surface/70 text-text-primary shadow-soft">
                Plateforme Congo-Brazzaville
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                Construisez votre entreprise avec un{" "}
                <span className="text-gradient">partenaire fiable.</span>
              </h1>
              <p className="mt-5 text-lg text-text-secondary">
                Mon partenaire orchestre chaque étape : cadrage des apports,
                sélection des profils et mise en route du projet jusqu’à la création
                légale.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" size="lg">
                  Publier un projet
                </Button>
                <Link
                  href="#exemples"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  Explorer les projets
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <FeatureItem
                  title="Apports clarifiés"
                  description="Cadrez finance, matériel et expertise dès le départ."
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
                  title="Accords sécurisés"
                  description="Suivez la répartition et les conditions d’entrée."
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
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-secondary">
                <div>
                  <p className="text-2xl font-semibold text-text-primary">120+</p>
                  <p>projets actifs</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">93%</p>
                  <p>match sur profils ciblés</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">4 semaines</p>
                  <p>jusqu’au cadrage final</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-6 hidden rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-xs shadow-soft md:block">
                <p className="font-semibold text-text-primary">Nouveau projet</p>
                <p className="text-text-secondary">Transformation agricole</p>
              </div>
              <div className="absolute -right-8 bottom-6 hidden rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-xs shadow-soft md:block">
                <p className="font-semibold text-text-primary">42%</p>
                <p className="text-text-secondary">objectif atteint</p>
              </div>
              <Card className="relative z-10 overflow-hidden border-border/60 bg-surface/85 shadow-medium">
                <div className="absolute left-0 top-0 h-32 w-32 -translate-x-12 -translate-y-12 rounded-full bg-accent/15" />
                <div className="absolute bottom-8 right-0 h-28 w-28 translate-x-10 rounded-full bg-accent-secondary/15 blur-2xl" />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-accent">Tableau de bord</p>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      Actif
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    Pilotez chaque engagement en temps réel.
                  </h2>
                  <div className="space-y-4 text-sm text-text-secondary">
                    {[
                      "Répartition des parts et apports",
                      "Suivi des jalons clés",
                      "Canal sécurisé pour les échanges",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
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
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="#comment-ca-marche"
                    className={cn(buttonVariants({ variant: "ghost" }))}
                  >
                    Voir le parcours complet
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
