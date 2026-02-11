"use client";

import { useTheme } from "@/components/theme-provider";

export function DashboardThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="dashboard-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.4 4.4l1.6 1.6M14 14l1.6 1.6M4.4 15.6 6 14M14 6l1.6-1.6" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M15.5 13.8A6.5 6.5 0 0 1 7 5.3a5.3 5.3 0 1 0 8.5 8.5Z" />
        </svg>
      )}
    </button>
  );
}

export default DashboardThemeToggle;
