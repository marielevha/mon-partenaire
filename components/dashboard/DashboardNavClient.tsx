"use client";

import dynamic from "next/dynamic";

type DashboardNavClientProps = {
  mobile?: boolean;
};

const DashboardNav = dynamic(
  () => import("@/components/dashboard/DashboardNav").then((mod) => mod.DashboardNav),
  {
    ssr: false,
    loading: () => (
      <nav className="space-y-2" aria-hidden="true">
        <div className="dashboard-panel-soft h-10 rounded-xl" />
        <div className="dashboard-panel-soft h-10 rounded-xl" />
        <div className="dashboard-panel-soft h-10 rounded-xl" />
        <div className="dashboard-panel-soft h-10 rounded-xl" />
        <div className="dashboard-panel-soft h-10 rounded-xl" />
        <div className="dashboard-panel-soft h-10 rounded-xl" />
      </nav>
    ),
  }
);

export function DashboardNavClient({ mobile = false }: DashboardNavClientProps) {
  return <DashboardNav mobile={mobile} />;
}

export default DashboardNavClient;
