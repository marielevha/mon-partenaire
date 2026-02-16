"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  markAllDashboardNotificationsReadAction,
  markDashboardNotificationReadAction,
} from "@/app/dashboard/notifications/actions";

type DashboardNotificationMenuItem = {
  id: string;
  createdAt: string;
  readAt: string | null;
  title: string;
  message: string;
  projectId?: string;
};

type DashboardNotificationsMenuProps = {
  notifications: DashboardNotificationMenuItem[];
  unreadCount: number;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function DashboardNotificationsMenu({
  notifications,
  unreadCount,
}: DashboardNotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        className="dashboard-icon-btn relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10 3a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.9L4 13h12l-1.4-1.8a3 3 0 0 1-.6-1.9V7a4 4 0 0 0-4-4Z" />
          <path d="M8 15a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] rounded-2xl border border-border/80 p-3 shadow-2xl sm:top-14"
          style={{
            backgroundColor: "var(--dashboard-sidebar)",
          }}
        >
          <div className="dashboard-divider flex items-center justify-between border-b border-border/70 px-2 pb-2">
            <p className="text-sm font-semibold">Notifications</p>
            <form action={markAllDashboardNotificationsReadAction}>
              <button
                type="submit"
                className="dashboard-faint text-xs font-medium transition-colors hover:text-accent"
              >
                Tout marquer lu
              </button>
            </form>
          </div>

          {notifications.length === 0 ? (
            <p className="dashboard-faint px-2 py-6 text-center text-sm">
              Aucune notification pour l’instant.
            </p>
          ) : (
            <div className="max-h-[360px] space-y-2 overflow-auto py-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border px-3 py-2 ${
                    notification.readAt
                      ? "border-border/70"
                      : "border-accent/40"
                  }`}
                  style={{
                    backgroundColor:
                      notification.readAt === null
                        ? "var(--dashboard-input-bg)"
                        : "var(--dashboard-bg)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    <span className="dashboard-faint shrink-0 text-[11px]">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="dashboard-faint mt-1 line-clamp-3 text-xs">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {notification.projectId ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/projects/${notification.projectId}/edit`}
                          className="dashboard-faint text-[11px] font-medium transition-colors hover:text-accent"
                          onClick={() => setOpen(false)}
                        >
                          Modifier
                        </Link>
                        <Link
                          href={`/projects/${notification.projectId}`}
                          className="dashboard-faint text-[11px] font-medium transition-colors hover:text-accent"
                          onClick={() => setOpen(false)}
                        >
                          Voir détail
                        </Link>
                      </div>
                    ) : (
                      <span className="dashboard-faint text-[11px]">-</span>
                    )}

                    {notification.readAt ? (
                      <span className="dashboard-faint text-[11px]">Lu</span>
                    ) : (
                      <form action={markDashboardNotificationReadAction}>
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />
                        <button
                          type="submit"
                          className="text-[11px] font-medium text-accent transition-colors hover:opacity-80"
                        >
                          Marquer lu
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dashboard-divider border-t border-border/70 pt-2">
            <Link
              href="/dashboard/notifications"
              className="dashboard-btn-secondary inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              onClick={() => setOpen(false)}
            >
              Ouvrir le centre de notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardNotificationsMenu;
