"use client";

import dynamic from "next/dynamic";

type DashboardTopbarUserMenuClientProps = {
  fullName: string;
  email: string;
};

const DashboardTopbarUserMenu = dynamic(
  () =>
    import("@/components/dashboard/DashboardTopbarUserMenu").then(
      (mod) => mod.DashboardTopbarUserMenu
    ),
  {
    ssr: false,
    loading: () => (
      <div className="dashboard-icon-btn h-12 w-44 rounded-full" aria-hidden="true" />
    ),
  }
);

export function DashboardTopbarUserMenuClient({
  fullName,
  email,
}: DashboardTopbarUserMenuClientProps) {
  return <DashboardTopbarUserMenu fullName={fullName} email={email} />;
}

export default DashboardTopbarUserMenuClient;
