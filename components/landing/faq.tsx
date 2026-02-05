import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";

const faqs = [
  {
    question: "Quels types de partenaires puis-je trouver ?",
    answer:
      "Des partenaires financiers, techniques ou opérationnels selon les besoins du projet.",
  },
  {
    question: "Les documents juridiques sont-ils obligatoires ?",
    answer:
      "Ils sont proposés pour sécuriser le partenariat, mais la validation finale reste à votre charge.",
  },
  {
    question: "Comment sont validés les projets ?",
    answer:
      "Chaque projet est revu manuellement pour vérifier la cohérence des informations.",
  },
  {
    question: "Puis-je modifier la répartition des parts ?",
    answer:
      "Oui, la répartition est un indicateur initial et peut évoluer avec l’accord des parties.",
  },
  {
    question: "La plateforme est-elle réservée au Congo-Brazzaville ?",
    answer:
      "Le MVP est conçu pour le contexte local, avec une ouverture possible à d’autres régions.",
  },
];

export function Faq() {
  return (
    <Section id="faq" className="bg-surface-accent">
      <Container>
        <div className="mb-10">
          <p className="text-sm font-semibold text-accent">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            Questions fréquentes
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question} className="border-accent/20 p-0">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-base font-medium text-text-primary">
                  {faq.question}
                  <span className="text-text-secondary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-text-secondary">
                  {faq.answer}
                </div>
              </details>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
