"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";

type DashboardNavProps = {
  mobile?: boolean;
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    isActive: (pathname: string) => normalizePathname(pathname) === "/dashboard",
  },
  {
    href: "/dashboard/projects",
    label: "Mes projets",
    isActive: (pathname: string) =>
      normalizePathname(pathname) === "/dashboard/projects" ||
      (normalizePathname(pathname).startsWith("/dashboard/projects/") &&
        !normalizePathname(pathname).startsWith("/dashboard/projects/new")),
  },
  {
    href: "/dashboard/projects/new",
    label: "Créer un projet",
    isActive: (pathname: string) =>
      normalizePathname(pathname) === "/dashboard/projects/new",
  },
];

export function DashboardNav({ mobile = false }: DashboardNavProps) {
  const pathname = normalizePathname(usePathname());

  return (
    <nav className={cn("space-y-2", mobile && "space-y-0")}>
      {navItems.map((item) => {
        const isActive = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "dashboard-nav-item-active"
                : "dashboard-nav-item"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default DashboardNav;
