import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  markAllDashboardNotificationsReadAction,
  markDashboardNotificationReadAction,
} from "@/app/dashboard/notifications/actions";
import { listDashboardNotificationsForUser } from "@/src/lib/notifications/dashboard-notifications";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications | Dashboard | Mon partenaire",
  description: "Centre de notifications interne du dashboard.",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function DashboardNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const notifications = await listDashboardNotificationsForUser(session.user.id, {
    limit: 200,
  });
  const unreadCount = notifications.filter((notification) => notification.readAt === null)
    .length;

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Notifications</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Centre de notifications</h1>
            <p className="dashboard-faint mt-2 max-w-3xl text-sm">
              Retrouvez ici les alertes internes liées à vos projets et aux demandes de
              correction.
            </p>
          </div>
          <form action={markAllDashboardNotificationsReadAction}>
            <button
              type="submit"
              className="dashboard-btn-secondary rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              Tout marquer comme lu
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Total</p>
          <p className="mt-2 text-2xl font-semibold">{notifications.length}</p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Non lues</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {unreadCount}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl p-4">
          <p className="dashboard-faint text-xs uppercase tracking-wide">Lues</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {notifications.length - unreadCount}
          </p>
        </div>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        {notifications.length === 0 ? (
          <div className="dashboard-divider dashboard-faint rounded-xl border border-dashed p-10 text-center text-sm">
            Aucune notification pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 ${
                  notification.readAt
                    ? "border-border/60 bg-background/40"
                    : "border-accent/40 bg-accent/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{notification.title}</h2>
                    <p className="dashboard-faint mt-1 text-sm">{notification.message}</p>
                  </div>
                  <span className="dashboard-faint text-xs">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notification.projectId ? (
                      <>
                        <Link
                          href={`/dashboard/projects/${notification.projectId}/edit`}
                          className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Modifier le projet
                        </Link>
                        <Link
                          href={`/projects/${notification.projectId}`}
                          className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Voir détail
                        </Link>
                      </>
                    ) : null}
                  </div>
                  {notification.readAt ? (
                    <span className="dashboard-faint text-xs">
                      Lu le {formatDate(notification.readAt)}
                    </span>
                  ) : (
                    <form action={markDashboardNotificationReadAction}>
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <button
                        type="submit"
                        className="dashboard-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        Marquer comme lu
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
