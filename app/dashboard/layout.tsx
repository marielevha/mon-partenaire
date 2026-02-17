import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { DashboardNavClient } from "@/components/dashboard/DashboardNavClient";
import { DashboardThemeToggle } from "@/components/dashboard/DashboardThemeToggle";
import { DashboardTopbarUserMenuClient } from "@/components/dashboard/DashboardTopbarUserMenuClient";
import { DashboardBrand } from "@/components/dashboard/DashboardBrand";
import { DashboardMobileMenu } from "@/components/dashboard/DashboardMobileMenu";
import { DashboardSidebarToggle } from "@/components/dashboard/DashboardSidebarToggle";
import {
  getDashboardUnreadNotificationsCount,
  listDashboardNotificationsForUser,
} from "@/src/lib/notifications/dashboard-notifications";
import { DashboardNotificationsMenu } from "@/components/dashboard/DashboardNotificationsMenu";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { getUserRbacSnapshot } from "@/src/lib/rbac/core";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  const rbacSnapshot = await getUserRbacSnapshot(session.user.id);
  if (!rbacSnapshot.permissionCodes.includes(RBAC_PERMISSIONS.DASHBOARD_ACCESS)) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  const metadataFullName =
    typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name.trim()
      : "";
  const profileFullName =
    typeof profile?.full_name === "string" ? profile.full_name.trim() : "";

  const fullName =
    profileFullName ||
    metadataFullName ||
    session.user.email?.split("@")[0] ||
    "Utilisateur";
  const [notifications, unreadNotificationsCount] = await Promise.all([
    listDashboardNotificationsForUser(session.user.id, { limit: 6 }),
    getDashboardUnreadNotificationsCount(session.user.id),
  ]);

  return (
    <div id="dashboard-shell-root" className="dashboard-shell min-h-screen">
      <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 border-r xl:flex xl:flex-col xl:overflow-hidden">
        <div className="dashboard-divider border-b px-6 py-6">
          <DashboardBrand />
        </div>
        {/* <div className="dashboard-divider border-b px-6 py-6">
          <p className="dashboard-faint text-xs uppercase tracking-[0.2em]">Mon partenaire</p>
          <p className="mt-2 text-2xl font-semibold">Dashboard</p>
          <DashboardBrand />
        </div> */}
          {/* <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center gap-4 px-6">
            <div className="md:hidden">
              <DashboardBrand compact />
            </div>
            <div className="hidden min-w-[320px] flex-1 md:flex"></div>
          </div> */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 [scrollbar-width:thin]">
          <p className="dashboard-faint mb-3 px-1 text-xs uppercase tracking-[0.2em]">
            Menu
          </p>
          <DashboardNavClient permissionCodes={rbacSnapshot.permissionCodes} />
        </div>
      </aside>

      <div className="dashboard-content min-h-screen xl:pl-72">
        <header className="dashboard-topbar sticky top-0 z-20 border-b backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-4 lg:px-6">
            <DashboardMobileMenu
              fullName={fullName}
              email={session.user.email ?? "Adresse email indisponible"}
              permissionCodes={rbacSnapshot.permissionCodes}
            />
            <DashboardSidebarToggle />
            <div className="xl:hidden">
              <DashboardBrand compact />
            </div>
            <div className="hidden min-w-[320px] flex-1 lg:flex">
              <label className="relative w-full max-w-xl">
                <span className="dashboard-faint pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  ⌕
                </span>
                <input
                  type="text"
                  placeholder="Rechercher un projet, un besoin..."
                  className="dashboard-input h-11 w-full rounded-xl pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="max-[430px]:hidden">
                <DashboardThemeToggle />
              </div>
              <DashboardNotificationsMenu
                notifications={notifications.map((notification) => ({
                  id: notification.id,
                  createdAt: notification.createdAt,
                  readAt: notification.readAt,
                  title: notification.title,
                  message: notification.message,
                  projectId: notification.projectId,
                }))}
                unreadCount={unreadNotificationsCount}
              />

              <DashboardTopbarUserMenuClient
                fullName={fullName}
                email={session.user.email ?? "Adresse email indisponible"}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
