import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

export function Audience() {
  return (
    <Section id="pour-qui">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-accent">Pour qui ?</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            Des profils complémentaires qui avancent ensemble.
          </h2>
          <p className="mt-4 text-sm text-text-secondary">
            Que vous portiez l’idée ou que vous apportiez des ressources, la
            plateforme structure les attentes dès le début.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-surface/80 shadow-medium">
            <h3 className="text-xl font-semibold text-text-primary">
              Porteur de projet
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              Vous avez une idée solide, un marché identifié et vous cherchez un
              partenaire financier ou opérationnel pour passer à l’étape suivante.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>• Structuration du business plan</li>
              <li>• Accès à des profils ciblés</li>
              <li>• Préparation des documents légaux</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-text-secondary">
              <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1">
                Industrie locale
              </span>
              <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1">
                Agro-business
              </span>
              <span className="rounded-full border border-border/60 bg-surface/70 px-3 py-1">
                Services urbains
              </span>
            </div>
          </Card>
          <Card className="border-border/60 bg-surface/80 shadow-medium">
            <h3 className="text-xl font-semibold text-text-primary">
              Partenaire financier ou compétence
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              Vous recherchez des projets crédibles et un cadre clair pour
              investir, accompagner et suivre l’évolution de l’entreprise.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>• Visibilité sur les apports</li>
              <li>• Deal room sécurisée</li>
              <li>• Répartition des parts transparente</li>
            </ul>
            <div className="mt-6 rounded-[var(--radius)] border border-border/60 bg-surface/70 p-4 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Ce que vous recevez
              </p>
              <p className="mt-2">
                Une synthèse de projet, un calendrier de décision et des points
                d’entrée clairs pour avancer rapidement.
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
