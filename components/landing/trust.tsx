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
        <div className="mb-10">
          <p className="text-sm font-semibold text-accent">Confiance & cadre</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            De la transparence dès le premier contact.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {trustPoints.map((point) => (
            <Card key={point.title} className="border-accent/20">
              <h3 className="text-lg font-semibold text-text-primary">
                {point.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {point.description}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Disclaimer : les documents modèles sont fournis à titre indicatif et
          doivent être validés par un conseiller juridique avant signature.
        </p>
      </Container>
    </Section>
  );
}
