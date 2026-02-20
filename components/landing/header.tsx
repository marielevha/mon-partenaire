import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/landing/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderClient } from "@/components/landing/header-client";
import { HeaderNav } from "@/components/landing/header-nav";
import { LocaleSwitcher } from "@/components/landing/locale-switcher";
import { MobileHeaderMenu } from "@/components/landing/mobile-header-menu";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";
import { getSessionAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getCurrentLocale, getI18n } from "@/src/i18n";

export async function Header() {
  const locale = await getCurrentLocale();
  const messages = await getI18n(locale);
  const headerMessages = messages.header;
  const session = await getSessionAction();
  const idleTimeoutMinutes = Number.parseInt(
    process.env.SESSION_IDLE_TIMEOUT_MINUTES || "30",
    10
  );
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
    <>
      {session?.user?.id ? (
        <SessionInactivityGuard enabled timeoutMinutes={idleTimeoutMinutes} />
      ) : null}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <Container className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-accent to-accent-secondary text-white shadow-soft">
            <Image
              src="/branding-logo.svg"
              alt={headerMessages.logoAlt}
              width={36}
              height={36}
              className="h-8 w-8"
              priority
            />
          </span>
          <span className="text-text-primary">{headerMessages.brandName}</span>
        </Link>

        <HeaderNav
          homeLabel={headerMessages.navHome}
          projectsLabel={headerMessages.navProjects}
          documentsLabel={headerMessages.navDocuments}
        />

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <LocaleSwitcher
              locale={locale}
              label={messages.locale.label}
              frLabel={messages.locale.fr}
              enLabel={messages.locale.en}
              cgLabel={messages.locale.cg}
            />
            <ThemeToggle />
            <HeaderClient
              initialSession={session}
              initialFullName={fullName}
              labels={{
                accountFallback: headerMessages.accountFallback,
                connectedAccount: headerMessages.connectedAccount,
                dashboard: headerMessages.menuDashboard,
                profile: headerMessages.menuProfile,
                support: headerMessages.menuSupport,
                logout: headerMessages.logout,
                login: headerMessages.login,
                signup: headerMessages.signup,
              }}
            />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileHeaderMenu
              locale={locale}
              initialSession={session}
              initialFullName={fullName}
              labels={{
                home: headerMessages.navHome,
                projects: headerMessages.navProjects,
                documents: headerMessages.navDocuments,
                accountFallback: headerMessages.accountFallback,
                connectedAccount: headerMessages.connectedAccount,
                dashboard: headerMessages.menuDashboard,
                profile: headerMessages.menuProfile,
                support: headerMessages.menuSupport,
                logout: headerMessages.logout,
                login: headerMessages.login,
                signup: headerMessages.signup,
                menuOpen: headerMessages.mobileMenuOpen,
                menuClose: headerMessages.mobileMenuClose,
                localeLabel: messages.locale.label,
                frLabel: messages.locale.fr,
                enLabel: messages.locale.en,
                cgLabel: messages.locale.cg,
              }}
            />
          </div>
        </div>
        </Container>
      </header>
    </>
  );
}
