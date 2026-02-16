"use client";

import Link from "next/link";
import { cn } from "@/components/ui/utils";

type DashboardBrandProps = {
  compact?: boolean;
  className?: string;
};

export function DashboardBrand({ compact = false, className }: DashboardBrandProps) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "group inline-flex items-center gap-3 rounded-xl transition-colors",
        className
      )}
    >
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent-strong text-white shadow-[0_10px_25px_rgba(99,102,241,0.35)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_50%)]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="relative h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M6 17V9" />
          <path d="M12 17V6" />
          <path d="M18 17v-4" />
          <path d="M4 17.5h16" />
        </svg>
      </span>

      <span className={cn("min-w-0", compact && "max-[420px]:hidden")}>
        {!compact ? (
          <span className="dashboard-faint block text-[11px] uppercase tracking-[0.22em]">
            Mon partenaire
          </span>
        ) : null}
        <span
          className={cn(
            "dashboard-strong block truncate font-semibold",
            compact ? "text-base" : "text-xl"
          )}
        >
          Mon Partenaire Pro
        </span>
        {!compact ? (
          <span className="dashboard-faint block text-xs">
            Espace pilotage investisseurs
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export default DashboardBrand;
