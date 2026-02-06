import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderClient } from "@/components/landing/header-client";
import { cn } from "@/components/ui/utils";
import { getSessionAction } from "@/app/auth/actions";

export async function Header() {
  const session = await getSessionAction();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-accent to-accent-secondary text-white shadow-soft">
              <Image
                src="/branding-logo.svg"
                alt="Logo Mon partenaire"
                width={36}
                height={36}
                className="h-8 w-8"
                priority
              />
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
          <HeaderClient initialSession={session} />
        </div>
      </Container>
    </header>
  );
}
