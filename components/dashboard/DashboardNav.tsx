"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/components/ui/utils";

type DashboardNavProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  permissionCodes?: string[];
};

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  isActive: (pathname: string) => boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

type IconName =
  | "home"
  | "chart"
  | "warning"
  | "logs"
  | "bell"
  | "projects"
  | "users"
  | "plus"
  | "documents"
  | "upload"
  | "profile"
  | "shield";

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const navGroups: NavGroup[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      {
        href: "/dashboard",
        label: "Vue d'ensemble",
        icon: "home",
        requiredPermission: "dashboard.overview.read",
        isActive: (pathname: string) => normalizePathname(pathname) === "/dashboard",
      },
      {
        href: "/dashboard/pilotage",
        label: "Pilotage business",
        icon: "chart",
        requiredPermission: "dashboard.pilotage.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/pilotage",
      },
      {
        href: "/dashboard/pilotage/incoherences",
        label: "Incohérences projets",
        icon: "warning",
        requiredPermission: "dashboard.quality.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/pilotage/incoherences" ||
          normalizePathname(pathname).startsWith("/dashboard/pilotage/incoherences/"),
      },
      {
        href: "/dashboard/logs",
        label: "Logs",
        icon: "logs",
        requiredPermission: "dashboard.logs.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/logs" ||
          normalizePathname(pathname).startsWith("/dashboard/logs/"),
      },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: "bell",
        requiredPermission: "dashboard.notifications.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/notifications" ||
          normalizePathname(pathname).startsWith("/dashboard/notifications/"),
      },
    ],
  },
  {
    id: "projects",
    label: "Projets",
    items: [
      {
        href: "/dashboard/projects/applications",
        label: "Candidatures",
        icon: "users",
        requiredPermission: "dashboard.projects.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/projects/applications" ||
          normalizePathname(pathname).startsWith("/dashboard/projects/applications/"),
      },
      {
        href: "/dashboard/projects",
        label: "Mes projets",
        icon: "projects",
        requiredPermission: "dashboard.projects.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/projects" ||
          (normalizePathname(pathname).startsWith("/dashboard/projects/") &&
            !normalizePathname(pathname).startsWith("/dashboard/projects/new") &&
            !normalizePathname(pathname).startsWith("/dashboard/projects/applications")),
      },
      {
        href: "/dashboard/projects/new",
        label: "Créer un projet",
        icon: "plus",
        requiredPermission: "dashboard.projects.create",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/projects/new",
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    items: [
      {
        href: "/dashboard/document-templates",
        label: "Templates documents",
        icon: "documents",
        requiredPermission: "dashboard.document_templates.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/document-templates" ||
          (normalizePathname(pathname).startsWith("/dashboard/document-templates/") &&
            !normalizePathname(pathname).startsWith("/dashboard/document-templates/new")),
      },
      {
        href: "/dashboard/document-templates/new",
        label: "Ajouter un document",
        icon: "upload",
        requiredPermission: "dashboard.document_templates.create",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/document-templates/new",
      },
    ],
  },
  {
    id: "account",
    label: "Compte",
    items: [
      {
        href: "/dashboard/profile",
        label: "Profil",
        icon: "profile",
        requiredPermission: "dashboard.profile.read",
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/profile" ||
          normalizePathname(pathname).startsWith("/dashboard/profile/"),
      },
      {
        href: "/dashboard/rbac",
        label: "Rôles & permissions",
        icon: "shield",
        requiredAnyPermissions: ["rbac.roles.read", "rbac.user_roles.read"],
        isActive: (pathname: string) =>
          normalizePathname(pathname) === "/dashboard/rbac" ||
          normalizePathname(pathname).startsWith("/dashboard/rbac/"),
      },
    ],
  },
];

function MenuItemIcon({ icon }: { icon: IconName }) {
  if (icon === "home") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 8.5 10 3l7 5.5V17H3V8.5Z" />
        <path d="M8 17v-5h4v5" />
      </svg>
    );
  }
  if (icon === "chart") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 17h14" />
        <path d="M5 14V9" />
        <path d="M10 14V6" />
        <path d="M15 14v-3" />
      </svg>
    );
  }
  if (icon === "warning") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 3 2.5 16h15L10 3Z" />
        <path d="M10 8v4" />
        <path d="M10 14.3h.01" />
      </svg>
    );
  }
  if (icon === "logs") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3.5" width="14" height="13" rx="2" />
        <path d="M6.5 7.5h7" />
        <path d="M6.5 10h7" />
        <path d="M6.5 12.5h4" />
      </svg>
    );
  }
  if (icon === "bell") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 3a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.9L4 13h12l-1.4-1.8a3 3 0 0 1-.6-1.9V7a4 4 0 0 0-4-4Z" />
        <path d="M8 15a2 2 0 0 0 4 0" />
      </svg>
    );
  }
  if (icon === "projects") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3.5" width="6" height="6" rx="1.5" />
        <rect x="11" y="3.5" width="6" height="6" rx="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    );
  }
  if (icon === "users") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="13.5" cy="8.2" r="2" />
        <path d="M3.5 15c.4-2.2 2.1-3.4 4.4-3.4h.2c2.3 0 4 1.2 4.4 3.4" />
        <path d="M12.3 14.8c.2-1.3 1.1-2.1 2.5-2.1h.1c1.3 0 2.2.8 2.4 2.1" />
      </svg>
    );
  }
  if (icon === "plus") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="10" cy="10" r="6.5" />
        <path d="M10 7v6" />
        <path d="M7 10h6" />
      </svg>
    );
  }
  if (icon === "documents") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3.5h5.5L15.5 7v9.5H6V3.5Z" />
        <path d="M11.5 3.5V7H15" />
        <path d="M8 10h6" />
        <path d="M8 12.8h6" />
      </svg>
    );
  }
  if (icon === "upload") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13V5.5" />
        <path d="m7 8.5 3-3 3 3" />
        <path d="M4 14.5h12" />
      </svg>
    );
  }
  if (icon === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 3 4.5 5.2V9c0 4.3 2.2 6.7 5.5 8 3.3-1.3 5.5-3.7 5.5-8V5.2L10 3Z" />
        <path d="m7.4 9.8 1.7 1.7 3.5-3.5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="6.5" r="3" />
      <path d="M4.5 16a5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

export function DashboardNav({
  mobile = false,
  onNavigate,
  permissionCodes = [],
}: DashboardNavProps) {
  const pathname = normalizePathname(usePathname());
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([]);
  const permissionSet = new Set(permissionCodes);

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.requiredAnyPermissions && item.requiredAnyPermissions.length > 0) {
          return item.requiredAnyPermissions.some((permissionCode) =>
            permissionSet.has(permissionCode)
          );
        }
        if (!item.requiredPermission) {
          return true;
        }
        return permissionSet.has(item.requiredPermission);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((previous) => {
      if (previous.includes(groupId)) {
        return previous.filter((id) => id !== groupId);
      }
      return [...previous, groupId];
    });
  };

  return (
    <nav className={cn("space-y-3", mobile && "space-y-2")}>
      {visibleNavGroups.map((group) => {
        const groupIsActive = group.items.some((item) => item.isActive(pathname));
        const isCollapsed = collapsedGroupIds.includes(group.id) && !groupIsActive;

        return (
          <section
            key={group.id}
            className={cn(
              "dashboard-panel-soft rounded-2xl border p-2.5",
              groupIsActive && "border-accent/40"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent/20 text-[11px] font-semibold text-accent">
                  •
                </span>
                <p className="dashboard-faint text-[11px] uppercase tracking-[0.16em]">
                  {group.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-label={isCollapsed ? `Ouvrir ${group.label}` : `Réduire ${group.label}`}
                className="dashboard-faint inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m5.5 8 4.5 4 4.5-4" />
                </svg>
              </button>
            </div>

            <div className={cn("space-y-1", isCollapsed && "hidden")}>
              {group.items.map((item) => {
                const isActive = item.isActive(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "dashboard-nav-item-active" : "dashboard-nav-item"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="dashboard-faint">
                        <MenuItemIcon icon={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

export default DashboardNav;
