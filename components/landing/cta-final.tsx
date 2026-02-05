import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { cn } from "@/components/ui/utils";

export function CtaFinal() {
  return (
    <Section>
      <Container>
        <Card className="relative overflow-hidden border-border/60 bg-surface/80 shadow-medium">
          <div className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-80" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-text-primary">
                Donnez une structure claire à votre partenariat.
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Lancez votre projet ou rejoignez une équipe porteuse de sens, en
                toute confiance.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" size="lg">
                  Créer un compte
                </Button>
                <Link
                  href="#comment-ca-marche"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  Découvrir le cadre
                </Link>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border/60 bg-surface/80 p-5 text-sm text-text-secondary">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Inclus
              </p>
              <ul className="mt-3 space-y-2">
                <li>• Accès immédiat aux modèles juridiques</li>
                <li>• Tableau de répartition automatique</li>
                <li>• Modération des projets en 48h</li>
              </ul>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
