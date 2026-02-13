import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { getI18n } from "@/src/i18n";

export async function Steps() {
  const messages = await getI18n();
  const t = messages.landing.steps;

  return (
    <Section id="comment-ca-marche" className="bg-surface-accent/70">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-text-primary">
              {t.title}
            </h2>
            <p className="mt-4 text-sm text-text-secondary">
              {t.description}
            </p>
            <div className="mt-8 space-y-4">
              {t.items.map((step, index) => (
                <Card
                  key={step.title}
                  className="flex items-start gap-5 border-border/60 bg-surface/80 shadow-medium"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accent">
                    0{index + 1}
                  </div>
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
          </div>
          <Card className="relative overflow-hidden border-border/60 bg-surface/85 shadow-medium">
            <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" />
            <div className="relative space-y-6">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {t.deliverablesEyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-text-primary">
                  {t.deliverablesTitle}
                </h3>
              </div>
              <div className="space-y-4 text-sm text-text-secondary">
                {t.deliverablesItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
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
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
