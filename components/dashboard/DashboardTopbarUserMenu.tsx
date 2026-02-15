"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { logoutAction } from "@/app/auth/actions";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/components/ui/utils";

type DashboardTopbarUserMenuProps = {
  fullName: string;
  email: string;
};

export function DashboardTopbarUserMenu({
  fullName,
  email,
}: DashboardTopbarUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const initials = useMemo(() => {
    const words = fullName.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "MP";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }, [fullName]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_full_name");
    await logoutAction();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
          isDark
            ? "border border-slate-700/80 bg-slate-900/70 text-slate-100 hover:border-slate-600"
            : "border border-slate-300 bg-white text-slate-900 hover:border-slate-400"
        )}
      >
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-semibold text-white">
          {initials}
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 bg-amber-400",
              isDark ? "border-slate-900" : "border-white"
            )}
          />
        </span>
        <span className="max-w-[130px] truncate text-sm font-medium">
          {fullName}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cn(
            "h-4 w-4 transition-transform",
            isDark ? "text-slate-400" : "text-slate-500",
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
          className={cn(
            "absolute right-0 z-50 mt-3 w-[300px] overflow-hidden rounded-2xl",
            isDark
              ? "border border-slate-700/80 bg-[#0f1b34] shadow-[0_28px_60px_rgba(2,8,23,0.5)]"
              : "border border-slate-200 bg-white shadow-[0_28px_60px_rgba(2,8,23,0.16)]"
          )}
        >
          <div
            className={cn(
              "border-b px-5 py-4",
              isDark ? "border-slate-700/80" : "border-slate-200"
            )}
          >
            <p
              className={cn(
                "truncate text-xl font-semibold",
                isDark ? "text-slate-100" : "text-slate-900"
              )}
            >
              {fullName}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-sm",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {email}
            </p>
          </div>

          <div className="p-2.5">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isDark
                  ? "text-slate-200 hover:bg-slate-800/70"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={cn(
                  "h-4 w-4",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="10" cy="6" r="3" />
                <path d="M4 17a6 6 0 0 1 12 0" />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/dashboard/profile"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isDark
                  ? "text-slate-200 hover:bg-slate-800/70"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={cn(
                  "h-4 w-4",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M10 2 3 5.5v9L10 18l7-3.5v-9z" />
                <path d="M3 5.5 10 9l7-3.5" />
                <path d="M10 9v9" />
              </svg>
              Profil
            </Link>

            <Link
              href="/a-propos#contact"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isDark
                  ? "text-slate-200 hover:bg-slate-800/70"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={cn(
                  "h-4 w-4",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
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

            <Link
              href="/"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isDark
                  ? "text-slate-200 hover:bg-slate-800/70"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={cn(
                  "h-4 w-4",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m3 9 7-6 7 6" />
                <path d="M5 8.5V17h10V8.5" />
              </svg>
              Accueil
            </Link>

            <div
              className={cn(
                "my-2 border-t",
                isDark ? "border-slate-700/80" : "border-slate-200"
              )}
            />

            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                isDark
                  ? "text-rose-200 hover:bg-rose-500/10"
                  : "text-rose-600 hover:bg-rose-50"
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
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
  );
}

export default DashboardTopbarUserMenu;
