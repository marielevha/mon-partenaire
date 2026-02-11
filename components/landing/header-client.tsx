"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { logoutAction } from "@/app/auth/actions";

interface HeaderClientProps {
  initialSession: Session | null;
  initialFullName?: string | null;
}

export function HeaderClient({ initialSession, initialFullName }: HeaderClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const email =
    typeof initialSession?.user?.email === "string"
      ? initialSession.user.email
      : "";
  const metadataFullName =
    typeof initialSession?.user?.user_metadata?.full_name === "string"
      ? initialSession.user.user_metadata.full_name
      : "";
  const fallbackName = email ? email.split("@")[0] : "Mon compte";
  const displayName = initialFullName?.trim() || metadataFullName.trim() || fallbackName;

  const initials = useMemo(() => {
    if (!displayName) return "MP";
    const words = displayName.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "MP";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_full_name");
    await logoutAction();
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      {displayName ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className="group inline-flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 text-left shadow-soft transition-colors hover:border-accent/50"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-xs font-bold text-white">
              {initials}
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-400" />
            </span>
            <span className="max-w-[130px] truncate text-sm font-medium text-text-primary">
              {displayName}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={cn(
                "h-4 w-4 text-text-secondary transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m5 8 5 5 5-5" />
            </svg>
          </button>

          {isOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-3 w-[290px] overflow-hidden rounded-2xl border border-border bg-surface/95 text-text-primary shadow-medium backdrop-blur-xl"
            >
              <div className="border-b border-border/70 px-5 py-4">
                <p className="text-base font-semibold text-text-primary">{displayName}</p>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {email || "Compte connecté"}
                </p>
              </div>

              <div className="p-2.5">
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-4 w-4 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 3h6v6H3z" />
                    <path d="M11 3h6v4h-6z" />
                    <path d="M11 9h6v8h-6z" />
                    <path d="M3 11h6v6H3z" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/a-propos"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-4 w-4 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="10" cy="6" r="3" />
                    <path d="M4 17a6 6 0 0 1 12 0" />
                  </svg>
                  Profil
                </Link>
              <Link
                href="/a-propos#contact"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-accent"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 14v-4" />
                  <path d="M10 6h.01" />
                </svg>
                Support
              </Link>
              <div className="my-2 border-t border-border/70" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-500 transition-colors hover:bg-rose-500/10"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M8 3H4v14h4" />
                  <path d="M12 6l4 4-4 4" />
                  <path d="M6 10h10" />
                </svg>
                Se déconnecter
              </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/auth/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Créer un compte
          </Link>
        </div>
      )}
    </div>
  );
}
