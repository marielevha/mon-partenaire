"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";

type HeaderNavProps = {
  homeLabel: string;
  projectsLabel: string;
  documentsLabel: string;
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

export function HeaderNav({
  homeLabel,
  projectsLabel,
  documentsLabel,
}: HeaderNavProps) {
  const pathname = usePathname() ?? "/";

  const homeActive = normalizePathname(pathname) === "/";
  const projectsActive = isRouteActive(pathname, "/projects");
  const documentsActive = isRouteActive(pathname, "/documents");

  return (
    <nav className="hidden items-center justify-center gap-2 text-sm md:flex">
      <Link
        href="/"
        aria-current={homeActive ? "page" : undefined}
        className={cn(
          "rounded-full px-3 py-1.5 transition-colors",
          homeActive
            ? "bg-accent/15 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {homeLabel}
      </Link>
      <Link
        href="/projects"
        aria-current={projectsActive ? "page" : undefined}
        className={cn(
          "rounded-full px-3 py-1.5 transition-colors",
          projectsActive
            ? "bg-accent/15 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {projectsLabel}
      </Link>
      <Link
        href="/documents"
        aria-current={documentsActive ? "page" : undefined}
        className={cn(
          "rounded-full px-3 py-1.5 transition-colors",
          documentsActive
            ? "bg-accent/15 text-accent"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        {documentsLabel}
      </Link>
    </nav>
  );
}

export default HeaderNav;
