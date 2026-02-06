import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  sideTitle: string;
  sideDescription: string;
  sideHighlights: { title: string; description: string }[];
  className?: string;
}

export function AuthCard({
  title,
  description,
  children,
  sideTitle,
  sideDescription,
  sideHighlights,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        "grid w-full max-w-6xl gap-10 p-8 md:p-10 lg:min-h-[80vh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
        className
      )}
    >
      <section className="relative overflow-hidden rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface-accent p-8 text-left shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-soft-glow opacity-80" />
        <div className="relative space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary">
              Mon partenaire
            </p>
            <h1 className="text-3xl font-semibold text-text-primary md:text-4xl">
              {sideTitle}
            </h1>
            <p className="text-base text-text-secondary md:text-lg">
              {sideDescription}
            </p>
          </div>
          <div className="space-y-5">
            {sideHighlights.map((highlight) => (
              <div key={highlight.title} className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <span className="h-4 w-4 rounded-full bg-accent" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {highlight.title}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {highlight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-md space-y-2 text-center">
          <p className="text-sm font-semibold text-text-secondary">
            {title}
          </p>
          <h2 className="text-2xl font-semibold text-text-primary">
            {description}
          </h2>
        </div>
        <div className="mt-8">{children}</div>
      </section>
    </Card>
  );
}
