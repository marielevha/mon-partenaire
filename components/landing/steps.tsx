import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

const steps = [
  {
    title: "Présentez votre projet",
    description:
      "Décrivez l’activité, les besoins, et les apports déjà disponibles.",
  },
  {
    title: "Identifiez le bon partenaire",
    description:
      "Analysez les profils, les compétences et le niveau d’engagement proposé.",
  },
  {
    title: "Formalisez l’accord",
    description:
      "Définissez les parts, sécurisez les échanges et préparez les statuts.",
  },
];

export function Steps() {
  return (
    <Section id="comment-ca-marche" className="bg-surface-accent">
      <Container>
        <div className="mb-10">
          <p className="text-sm font-semibold text-accent">Comment ça marche</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            Trois étapes, un cadre clair.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="flex flex-col gap-4 border-accent/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
