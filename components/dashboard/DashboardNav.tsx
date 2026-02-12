"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";

type DashboardNavProps = {
  mobile?: boolean;
};

const navItems = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/projects",
    label: "Mes projets",
    isActive: (pathname: string) =>
      pathname === "/dashboard/projects" ||
      (pathname.startsWith("/dashboard/projects/") &&
        pathname !== "/dashboard/projects/new"),
  },
  {
    href: "/dashboard/projects/new",
    label: "Créer un projet",
    isActive: (pathname: string) => pathname === "/dashboard/projects/new",
  },
];

export function DashboardNav({ mobile = false }: DashboardNavProps) {
  const pathname = usePathname();

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
