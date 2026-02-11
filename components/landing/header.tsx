import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/landing/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderClient } from "@/components/landing/header-client";
import { getSessionAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function Header() {
  const session = await getSessionAction();
  let fullName: string | null = null;

  if (session?.user?.id) {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (typeof profile?.full_name === "string" && profile.full_name.trim()) {
      fullName = profile.full_name.trim();
    }
  }

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
          <HeaderClient initialSession={session} initialFullName={fullName} />
        </div>
      </Container>
    </header>
  );
}
