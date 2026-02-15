import Link from "next/link";
import { Container } from "@/components/landing/container";
import { getI18n } from "@/src/i18n";

export async function Footer() {
  const messages = await getI18n();
  const footerMessages = messages.landing.footer;
  const brandName = messages.header.brandName;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-surface-accent/70">
      <Container className="flex flex-col gap-8 py-10 text-sm text-text-secondary md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-text-primary">{brandName}</p>
            <p className="mt-2">{footerMessages.disclaimer}</p>
          </div>
          <p className="text-xs text-text-secondary">
            © {currentYear} {brandName}.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-text-primary">{footerMessages.infosTitle}</p>
          <div className="flex flex-col gap-2">
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/politique"
            >
              {footerMessages.privacy}
            </Link>
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/conditions"
            >
              {footerMessages.terms}
            </Link>
            <Link
              className="transition-colors hover:text-text-primary hover:underline"
              href="/a-propos"
            >
              {footerMessages.about}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
