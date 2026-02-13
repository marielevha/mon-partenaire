import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { FeatureItem } from "@/components/landing/feature-item";
import { cn } from "@/components/ui/utils";
import { getI18n } from "@/src/i18n";

export async function Hero() {
  const messages = await getI18n();
  const t = messages.landing.hero;

  return (
    <Section className="pt-16">
      <Container>
        <div className="relative overflow-hidden rounded-[calc(var(--radius)+8px)] border border-border/60 bg-surface/85 px-6 py-12 shadow-medium backdrop-blur sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-soft-glow" />
          <div className="pointer-events-none absolute -left-20 top-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-10 h-32 w-32 rounded-full bg-accent-secondary/20 blur-3xl" />
          <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="mb-6 border-border/60 bg-surface/70 text-text-primary shadow-soft">
                {t.badge}
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                {t.titleBefore} <span className="text-gradient">{t.titleHighlight}</span>
              </h1>
              <p className="mt-5 text-lg text-text-secondary">
                {t.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href="/projects"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  {t.secondaryCta}
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <FeatureItem
                  title={t.features[0].title}
                  description={t.features[0].description}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 6v12" />
                      <path d="M8 10h8" />
                      <path d="M4 6h16" />
                      <path d="M4 18h16" />
                    </svg>
                  }
                />
                <FeatureItem
                  title={t.features[1].title}
                  description={t.features[1].description}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 12h18" />
                      <path d="M12 3v18" />
                      <path d="M19.5 6.5 17 4" />
                    </svg>
                  }
                />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-secondary">
                <div>
                  <p className="text-2xl font-semibold text-text-primary">{t.stats[0].value}</p>
                  <p>{t.stats[0].label}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">{t.stats[1].value}</p>
                  <p>{t.stats[1].label}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">{t.stats[2].value}</p>
                  <p>{t.stats[2].label}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-6 hidden rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-xs shadow-soft md:block">
                <p className="font-semibold text-text-primary">{t.floatingCardTopTitle}</p>
                <p className="text-text-secondary">{t.floatingCardTopSubtitle}</p>
              </div>
              <div className="absolute -right-8 bottom-6 hidden rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-xs shadow-soft md:block">
                <p className="font-semibold text-text-primary">{t.floatingCardBottomTitle}</p>
                <p className="text-text-secondary">{t.floatingCardBottomSubtitle}</p>
              </div>
              <Card className="relative z-10 overflow-hidden border-border/60 bg-surface/85 shadow-medium">
                <div className="absolute left-0 top-0 h-32 w-32 -translate-x-12 -translate-y-12 rounded-full bg-accent/15" />
                <div className="absolute bottom-8 right-0 h-28 w-28 translate-x-10 rounded-full bg-accent-secondary/15 blur-2xl" />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-accent">{t.dashboardLabel}</p>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      {t.dashboardStatus}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    {t.dashboardTitle}
                  </h2>
                  <div className="space-y-4 text-sm text-text-secondary">
                    {t.dashboardItems.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
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
                  <Link
                    href="#comment-ca-marche"
                    className={cn(buttonVariants({ variant: "ghost" }))}
                  >
                    {t.dashboardCta}
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
