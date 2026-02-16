"use client";

import { useEffect, useState } from "react";
import { DashboardNavClient } from "@/components/dashboard/DashboardNavClient";

type DashboardMobileMenuProps = {
  fullName: string;
  email: string;
};

export function DashboardMobileMenu({ fullName, email }: DashboardMobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="dashboard-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 5h14" />
          <path d="M3 10h14" />
          <path d="M3 15h14" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-[2px]"
          />

          <aside
            className="dashboard-sidebar absolute left-1/2 top-4 flex w-[min(94vw,420px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(2,8,23,0.55)]"
            style={{
              maxHeight: "calc(100vh - 2rem)",
              backgroundColor: "var(--dashboard-sidebar)",
            }}
          >
            <div className="dashboard-divider flex items-start justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <p className="dashboard-faint text-[11px] uppercase tracking-[0.2em]">
                  Espace membre
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{fullName}</p>
                <p className="dashboard-faint truncate text-xs">{email}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="dashboard-icon-btn inline-flex h-9 w-9 items-center justify-center rounded-lg"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m5 5 10 10" />
                  <path d="M15 5 5 15" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
              <p className="dashboard-faint mb-3 px-1 text-xs uppercase tracking-[0.2em]">
                Menu
              </p>
              <DashboardNavClient mobile onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardMobileMenu;
