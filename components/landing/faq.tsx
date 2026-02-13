import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { getI18n } from "@/src/i18n";

export async function Faq() {
  const messages = await getI18n();
  const t = messages.landing.faq;

  return (
    <Section id="faq" className="bg-surface-accent/70">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-text-primary">
              {t.title}
            </h2>
            <p className="mt-4 text-sm text-text-secondary">
              {t.description}
            </p>
            <div className="mt-6 rounded-[var(--radius)] border border-border/60 bg-surface/80 p-5 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t.supportTitle}
              </p>
              <p className="mt-2">{t.supportText}</p>
            </div>
          </div>
          <div className="space-y-4">
            {t.items.map((faq) => (
              <Card
                key={faq.question}
                className="border-border/60 bg-surface/80 p-0 shadow-soft"
              >
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
        </div>
      </Container>
    </Section>
  );
}
