import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { getI18n } from "@/src/i18n";

export async function Audience() {
  const messages = await getI18n();
  const t = messages.landing.audience;

  return (
    <Section id="pour-qui">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            {t.title}
          </h2>
          <p className="mt-4 text-sm text-text-secondary">
            {t.description}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-surface/80 shadow-medium">
            <h3 className="text-xl font-semibold text-text-primary">
              {t.founderTitle}
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              {t.founderDescription}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              {t.founderBullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-text-secondary">
              {t.founderTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 bg-surface/70 px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>
          <Card className="border-border/60 bg-surface/80 shadow-medium">
            <h3 className="text-xl font-semibold text-text-primary">
              {t.partnerTitle}
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              {t.partnerDescription}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              {t.partnerBullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-[var(--radius)] border border-border/60 bg-surface/70 p-4 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t.partnerBoxTitle}
              </p>
              <p className="mt-2">
                {t.partnerBoxText}
              </p>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
