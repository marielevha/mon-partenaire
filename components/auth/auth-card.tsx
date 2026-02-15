import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

interface AuthCardProps {
  title: string;
  description?: string;
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
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary transition-colors hover:text-text-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-accent to-accent-secondary text-white shadow-soft">
                <Image
                  src="/branding-logo.svg"
                  alt="Logo Mon partenaire"
                  width={26}
                  height={26}
                  className="h-6 w-6"
                />
              </span>
              Mon partenaire
            </Link>
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
        <div className="mx-auto w-full max-w-md space-y-3 text-center">
          <div className="flex justify-center">
            <p className="inline-flex items-center rounded-full border border-accent/35 bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
              {title}
            </p>
          </div>
          {description?.trim() ? (
            <h2 className="text-2xl font-semibold leading-tight text-text-primary md:text-3xl">
              {description}
            </h2>
          ) : null}
        </div>
        <div className="mt-8">{children}</div>
      </section>
    </Card>
  );
}
