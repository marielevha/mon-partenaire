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
        <Card className="relative overflow-hidden border-accent/30 bg-surface-accent">
          <div className="pointer-events-none absolute inset-0 bg-accent-gradient" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-text-primary">
                Donnez une structure claire à votre partenariat.
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Lancez votre projet ou rejoignez une équipe porteuse de sens, en
                toute confiance.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
        </Card>
      </Container>
    </Section>
  );
}
