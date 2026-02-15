"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/ui/utils";
import { logoutAction } from "@/app/auth/actions";
import type { AppLocale } from "@/src/i18n";

type MobileHeaderMenuProps = {
  locale: AppLocale;
  initialSession: Session | null;
  initialFullName?: string | null;
  labels: {
    home: string;
    projects: string;
    documents: string;
    accountFallback: string;
    connectedAccount: string;
    dashboard: string;
    profile: string;
    support: string;
    logout: string;
    login: string;
    signup: string;
    menuOpen: string;
    menuClose: string;
    localeLabel: string;
    frLabel: string;
    enLabel: string;
    cgLabel: string;
  };
};

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isRouteActive(pathname: string, route: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRoute = normalizePathname(route);
  return (
    normalizedPathname === normalizedRoute ||
    normalizedPathname.startsWith(`${normalizedRoute}/`)
  );
}

function buildSwitchHref(targetLocale: AppLocale, nextPath: string) {
  const params = new URLSearchParams({
    locale: targetLocale,
    next: nextPath || "/",
  });

  return `/api/locale?${params.toString()}`;
}

export function MobileHeaderMenu({
  locale,
  initialSession,
  initialFullName,
  labels,
}: MobileHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const isAuthenticated = Boolean(initialSession?.user?.id);

  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const email =
    typeof initialSession?.user?.email === "string" ? initialSession.user.email : "";
  const metadataFullName =
    typeof initialSession?.user?.user_metadata?.full_name === "string"
      ? initialSession.user.user_metadata.full_name
      : "";
  const fallbackName = email ? email.split("@")[0] : labels.accountFallback;
  const displayName = initialFullName?.trim() || metadataFullName.trim() || fallbackName;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    setIsOpen(false);
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_full_name");
    await logoutAction();
  };

  const navItems = [
    { href: "/", label: labels.home, active: normalizePathname(pathname) === "/" },
    { href: "/projects", label: labels.projects, active: isRouteActive(pathname, "/projects") },
    {
      href: "/documents",
      label: labels.documents,
      active: isRouteActive(pathname, "/documents"),
    },
  ];

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? labels.menuClose : labels.menuOpen}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary shadow-soft transition-colors hover:border-accent/60"
      >
        {isOpen ? (
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m5 5 10 10" />
            <path d="m15 5-10 10" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h14" />
            <path d="M3 10h14" />
            <path d="M3 15h14" />
          </svg>
        )}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-border bg-surface/95 text-text-primary shadow-medium backdrop-blur-xl"
        >
          <div className="border-b border-border/70 px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              {displayName || labels.accountFallback}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {email || labels.connectedAccount}
            </p>
          </div>

          <div className="space-y-3 p-3">
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-sm transition-colors",
                    item.active
                      ? "bg-accent/15 text-accent"
                      : "text-text-primary hover:bg-surface-accent"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="rounded-xl border border-border/70 p-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                {labels.localeLabel}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {(
                  [
                    { key: "fr", label: labels.frLabel },
                    { key: "en", label: labels.enLabel },
                    { key: "cg", label: labels.cgLabel },
                  ] as const
                ).map((item) => (
                  <a
                    key={item.key}
                    href={buildSwitchHref(item.key, nextPath)}
                    onClick={closeMenu}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-colors",
                      locale === item.key
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:bg-surface-accent hover:text-text-primary"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="border-t border-border/70 pt-2">
              {isAuthenticated ? (
                <div className="space-y-1.5">
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    {labels.dashboard}
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    {labels.profile}
                  </Link>
                  <Link
                    href="/a-propos#contact"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    {labels.support}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-rose-500 transition-colors hover:bg-rose-500/10"
                  >
                    {labels.logout}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="rounded-xl border border-border px-3 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    {labels.login}
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={closeMenu}
                    className="rounded-xl bg-accent px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
                  >
                    {labels.signup}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MobileHeaderMenu;
