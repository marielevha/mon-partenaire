import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { cn } from "@/components/ui/utils";
import { getI18n } from "@/src/i18n";

export async function CtaFinal() {
  const messages = await getI18n();
  const t = messages.landing.cta;

  return (
    <Section>
      <Container>
        <Card className="relative overflow-hidden border-border/60 bg-surface/80 shadow-medium">
          <div className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-80" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-text-primary">
                {t.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {t.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href="#comment-ca-marche"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  {t.secondaryCta}
                </Link>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border/60 bg-surface/80 p-5 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {t.includedTitle}
              </p>
              <ul className="mt-3 space-y-2">
                {t.includedItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
