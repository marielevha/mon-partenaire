"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";

const tabs = [
  { href: "/dashboard/rbac", label: "Affectations" },
  { href: "/dashboard/rbac/roles", label: "Rôles" },
  { href: "/dashboard/rbac/permissions", label: "Permissions" },
];

export function RbacTabs() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-panel-soft flex flex-wrap gap-2 rounded-xl p-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-white shadow-[0_8px_20px_-12px_rgba(99,102,241,0.85)]"
                : "dashboard-faint hover:bg-accent/10 hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default RbacTabs;
