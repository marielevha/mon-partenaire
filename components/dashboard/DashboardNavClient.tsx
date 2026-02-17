"use client";

import dynamic from "next/dynamic";

type DashboardNavClientProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  permissionCodes?: string[];
};

const DashboardNav = dynamic(
  () => import("@/components/dashboard/DashboardNav").then((mod) => mod.DashboardNav),
  {
    ssr: false,
    loading: () => (
      <nav className="space-y-3" aria-hidden="true">
        <div className="dashboard-panel-soft rounded-2xl p-2.5">
          <div className="mb-2 h-4 w-24 rounded-md bg-accent/20" />
          <div className="space-y-1">
            <div className="h-9 rounded-xl bg-background/60" />
            <div className="h-9 rounded-xl bg-background/60" />
            <div className="h-9 rounded-xl bg-background/60" />
          </div>
        </div>
        <div className="dashboard-panel-soft rounded-2xl p-2.5">
          <div className="mb-2 h-4 w-20 rounded-md bg-accent/20" />
          <div className="space-y-1">
            <div className="h-9 rounded-xl bg-background/60" />
            <div className="h-9 rounded-xl bg-background/60" />
          </div>
        </div>
        <div className="dashboard-panel-soft rounded-2xl p-2.5">
          <div className="mb-2 h-4 w-24 rounded-md bg-accent/20" />
          <div className="space-y-1">
            <div className="h-9 rounded-xl bg-background/60" />
            <div className="h-9 rounded-xl bg-background/60" />
          </div>
        </div>
      </nav>
    ),
  }
);

export function DashboardNavClient({
  mobile = false,
  onNavigate,
  permissionCodes,
}: DashboardNavClientProps) {
  return (
    <DashboardNav
      mobile={mobile}
      onNavigate={onNavigate}
      permissionCodes={permissionCodes}
    />
  );
}

export default DashboardNavClient;
