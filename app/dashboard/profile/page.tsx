import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";
import { ProfilePasswordForm } from "@/components/dashboard/ProfilePasswordForm";

export const metadata: Metadata = {
  title: "Profil | Dashboard | Mon partenaire",
  description: "Gérez votre profil utilisateur dans le dashboard.",
};

type ProfileRecord = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type CountRow = { count: number };

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, created_at, updated_at")
    .eq("id", session.user.id)
    .maybeSingle();

  const profileRecord = (profile as ProfileRecord | null) ?? null;
  const metadataFullName =
    typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name.trim()
      : "";
  const defaultFullName =
    profileRecord?.full_name?.trim() ||
    metadataFullName ||
    session.user.email?.split("@")[0] ||
    "Utilisateur";

  const [projectsCount, publishedProjectsCount, openNeedsCount, templatesCountRows] =
    await Promise.all([
      prisma.project.count({
        where: { ownerId: session.user.id },
      }),
      prisma.project.count({
        where: { ownerId: session.user.id, status: "PUBLISHED" },
      }),
      prisma.projectNeed.count({
        where: {
          isFilled: false,
          project: { ownerId: session.user.id },
        },
      }),
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::int AS count
        FROM "DocumentTemplate"
        WHERE "ownerId" = ${session.user.id}
      `,
    ]);
  const documentTemplatesCount = templatesCountRows[0]?.count ?? 0;

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Profil</span>
        </div>
        <h1 className="text-3xl font-semibold">Mon profil</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Centralisez vos informations personnelles et vérifiez l&apos;activité de votre
          compte.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="dashboard-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Informations personnelles</h2>
          <p className="dashboard-faint mt-1 text-sm">
            Ces informations sont affichées dans votre espace membre et vos menus dashboard.
          </p>
          <div className="mt-5">
            <ProfileSettingsForm
              initialValues={{
                fullName: defaultFullName,
                phone: profileRecord?.phone ?? "",
                avatarUrl: profileRecord?.avatar_url ?? "",
                email: session.user.email ?? "Adresse email indisponible",
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-panel rounded-2xl p-6">
            <h2 className="text-base font-semibold">Compte</h2>
            <div className="dashboard-faint mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span>Email</span>
                <span className="max-w-[220px] text-right font-medium text-text-primary">
                  {session.user.email ?? "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span>ID utilisateur</span>
                <span className="max-w-[220px] break-all text-right font-medium text-text-primary">
                  {session.user.id}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span>Créé le</span>
                <span className="text-right font-medium text-text-primary">
                  {formatDate(profileRecord?.created_at ?? session.user.created_at)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span>Dernière mise à jour</span>
                <span className="text-right font-medium text-text-primary">
                  {formatDate(profileRecord?.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel rounded-2xl p-6">
            <h2 className="text-base font-semibold">Activité</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Projets</p>
                <p className="mt-1 text-xl font-semibold">{projectsCount}</p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Publiés</p>
                <p className="mt-1 text-xl font-semibold">{publishedProjectsCount}</p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Besoins ouverts</p>
                <p className="mt-1 text-xl font-semibold">{openNeedsCount}</p>
              </div>
              <div className="dashboard-panel-soft rounded-xl p-3">
                <p className="dashboard-faint text-xs uppercase tracking-wide">Templates</p>
                <p className="mt-1 text-xl font-semibold">{documentTemplatesCount}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-panel rounded-2xl p-6">
            <h2 className="text-base font-semibold">Sécurité</h2>
            <p className="dashboard-faint mt-1 text-sm">
              Changez votre mot de passe pour sécuriser votre accès dashboard.
            </p>
            <div className="mt-4">
              <ProfilePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
