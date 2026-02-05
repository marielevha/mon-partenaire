import Link from "next/link";
import { Container } from "@/components/landing/container";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-surface-accent/70">
      <Container className="flex flex-col gap-4 py-10 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-text-primary">Mon partenaire</p>
          <p className="mt-2">
            Disclaimer : les documents modèles sont fournis à titre indicatif.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link className="transition-colors hover:text-text-primary" href="#">
            Mentions
          </Link>
          <Link className="transition-colors hover:text-text-primary" href="#">
            Contact
          </Link>
          <Link className="transition-colors hover:text-text-primary" href="#">
            Documents modèles
          </Link>
        </div>
      </Container>
    </footer>
  );
}
