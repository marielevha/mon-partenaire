import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

const examples = [
  {
    title: "Pisciculture",
    capital: "750 000 FCFA",
    apports: "300 000 FCFA + expertise aquacole",
    profils: "Investisseur, gestion logistique",
    repartition: "60% porteur / 40% partenaire",
    status: "Ouvert",
    progress: 62,
  },
  {
    title: "Transformation de manioc",
    capital: "1 200 000 FCFA",
    apports: "Local équipé + réseau de distribution",
    profils: "Financement équipement, marketing",
    repartition: "55% porteur / 45% partenaires",
    status: "Ouvert",
    progress: 48,
  },
  {
    title: "Élevage de poules pondeuses",
    capital: "900 000 FCFA",
    apports: "Terrain + expérience élevage",
    profils: "Investisseur, gestion achats",
    repartition: "65% porteur / 35% partenaire",
    status: "Clos",
    progress: 100,
  },
];

export function Examples() {
  return (
    <Section id="exemples" className="bg-surface-accent">
      <Container>
        <div className="mb-10">
          <p className="text-sm font-semibold text-accent">Exemples de projets</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            Des projets concrets, des besoins précis.
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {examples.map((example) => (
            <Card key={example.title} className="flex flex-col overflow-hidden border-accent/20 p-0">
              <div className="relative h-44 w-full bg-gradient-to-br from-accent/15 via-accent-secondary/20 to-transparent">
                <div className="absolute inset-0 bg-grid opacity-60" />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <Badge
                    className={
                      example.status === "Clos"
                        ? "border-rose-200/60 bg-rose-500/10 text-rose-500"
                        : "border-emerald-200/60 bg-emerald-500/10 text-emerald-600"
                    }
                  >
                    {example.status}
                  </Badge>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Capital total
                    </p>
                    <p className="text-xl font-semibold text-text-primary">
                      {example.capital}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {example.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Apports:</span>{" "}
                    {example.apports}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      Profils recherchés:
                    </span>{" "}
                    {example.profils}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      Répartition indicative:
                    </span>{" "}
                    {example.repartition}
                  </p>
                </div>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                    <span>Objectif atteint</span>
                    <span>{example.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border/60">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-secondary"
                      style={{ width: `${example.progress}%` }}
                    />
                  </div>
                  <Button variant="secondary" className="w-full">
                    More
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
