import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

const trustPoints = [
  {
    title: "Parts définies dès le départ",
    description:
      "Une grille de répartition claire pour éviter les zones d’ombre.",
  },
  {
    title: "Deal room privée",
    description:
      "Échangez vos documents et discussions dans un espace sécurisé.",
  },
  {
    title: "Documents modèles",
    description:
      "Accès à des statuts et contrats adaptés au contexte local.",
  },
  {
    title: "Validation manuelle (MVP)",
    description:
      "Chaque projet est vérifié pour garantir la crédibilité des annonces.",
  },
];

export function Trust() {
  return (
    <Section id="confiance">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-accent">Confiance & cadre</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            De la transparence dès le premier contact.
          </h2>
          <p className="mt-4 text-sm text-text-secondary">
            Une expérience guidée pour éviter les malentendus et accélérer la
            prise de décision.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {trustPoints.map((point) => (
              <Card
                key={point.title}
                className="flex flex-col gap-4 border-border/60 bg-surface/80 shadow-medium"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
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
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {point.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <Card className="relative overflow-hidden border-border/60 bg-surface/85 shadow-medium">
            <div className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-70" />
            <div className="relative space-y-4">
              <p className="text-sm font-semibold text-accent">Score confiance</p>
              <h3 className="text-2xl font-semibold text-text-primary">
                4.8/5 sur la clarté des échanges.
              </h3>
              <p className="text-sm text-text-secondary">
                Les utilisateurs apprécient la transparence des apports et la
                formalisation rapide des engagements.
              </p>
            </div>
          </Card>
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Disclaimer : les documents modèles sont fournis à titre indicatif et
          doivent être validés par un conseiller juridique avant signature.
        </p>
      </Container>
    </Section>
  );
}
