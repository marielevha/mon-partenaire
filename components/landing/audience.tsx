import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

export function Audience() {
  return (
    <Section id="pour-qui">
      <Container>
        <div className="mb-10">
          <p className="text-sm font-semibold text-accent">Pour qui ?</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            Des profils complémentaires qui avancent ensemble.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
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
          </Card>
          <Card>
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
          </Card>
        </div>
      </Container>
    </Section>
  );
}
