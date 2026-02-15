"use client";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui/utils";
import type { AppLocale } from "@/src/i18n";

type LocaleSwitcherProps = {
  locale: AppLocale;
  label: string;
  frLabel: string;
  enLabel: string;
  cgLabel: string;
};

function buildSwitchHref(targetLocale: AppLocale, nextPath: string) {
  const params = new URLSearchParams({
    locale: targetLocale,
    next: nextPath || "/",
  });

  return `/api/locale?${params.toString()}`;
}

export function LocaleSwitcher({
  locale,
  label,
  frLabel,
  enLabel,
  cgLabel,
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  return (
    <div
      className="hidden items-center gap-1 rounded-full border border-border bg-surface p-1 sm:inline-flex"
      aria-label={label}
    >
      <a
        href={buildSwitchHref("fr", nextPath)}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          locale === "fr"
            ? "bg-accent text-white"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {frLabel}
      </a>
      <a
        href={buildSwitchHref("en", nextPath)}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          locale === "en"
            ? "bg-accent text-white"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {enLabel}
      </a>
      <a
        href={buildSwitchHref("cg", nextPath)}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          locale === "cg"
            ? "bg-accent text-white"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {cgLabel}
      </a>
    </div>
  );
}

export default LocaleSwitcher;
