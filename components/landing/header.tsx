import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/components/ui/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-soft">
              MP
            </span>
            <span className="text-text-primary">Mon partenaire</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
            <a className="transition-colors hover:text-text-primary" href="#comment-ca-marche">
              Comment ça marche
            </a>
            <a className="transition-colors hover:text-text-primary" href="#exemples">
              Exemples
            </a>
            <a className="transition-colors hover:text-text-primary" href="#confiance">
              Confiance
            </a>
            <a className="transition-colors hover:text-text-primary" href="#faq">
              FAQ
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="#"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Se connecter
            </Link>
            <Button variant="primary" size="sm">
              Créer un compte
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
