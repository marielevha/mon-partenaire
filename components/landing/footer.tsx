import Link from "next/link";
import { Container } from "@/components/landing/container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-surface-accent/70">
      <Container className="flex flex-col gap-8 py-10 text-sm text-text-secondary md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-text-primary">Mon partenaire</p>
            <p className="mt-2">
              Disclaimer : les documents modèles sont fournis à titre indicatif.
            </p>
          </div>
          <p className="text-xs text-text-secondary">
            © {currentYear} Mon partenaire.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-text-primary">Informations</p>
          <div className="flex flex-col gap-2">
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/politique"
            >
              Politique de confidentialité
            </Link>
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/conditions"
            >
              Conditions générales
            </Link>
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/a-propos"
            >
              À propos
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
