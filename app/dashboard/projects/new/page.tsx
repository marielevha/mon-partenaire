import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { CreateProjectForm } from "@/components/dashboard/CreateProjectForm";

export const metadata: Metadata = {
  title: "Nouveau projet | Dashboard | Mon partenaire",
  description: "Créez un nouveau projet depuis votre espace dashboard.",
};

export default async function DashboardCreateProjectPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const fullName =
    typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : session.user.email;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background py-8 text-text-primary">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="overflow-hidden p-0">
                <div className="border-b border-border/60 bg-surface-accent/70 px-5 py-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Espace membre</p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{fullName}</p>
                </div>
                <nav className="space-y-1 p-3 text-sm">
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 font-medium text-text-primary transition-colors hover:bg-surface-accent"
                  >
                    Vue d&apos;ensemble
                  </Link>
                  <Link
                    href="/dashboard/projects/new"
                    className="block rounded-md bg-accent/10 px-3 py-2 font-medium text-accent"
                  >
                    Créer un projet
                  </Link>
                </nav>
              </Card>

              <Card className="space-y-2 p-4 text-sm text-text-secondary">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Avant publication</p>
                <p>1. Soignez le résumé et la description.</p>
                <p>2. Vérifiez les montants saisis.</p>
                <p>3. Publiez ensuite depuis le dashboard.</p>
              </Card>
            </aside>

            <section className="space-y-6">
              <Card className="p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
                  <Link href="/dashboard" className="hover:text-text-primary">
                    Dashboard
                  </Link>
                  <span>/</span>
                  <span className="text-text-primary">Nouveau projet</span>
                </div>
                <h1 className="text-3xl font-semibold">Créer un projet complet</h1>
                <p className="mt-2 max-w-3xl text-sm text-text-secondary">
                  Renseignez les informations essentielles de votre projet. Il sera créé en brouillon,
                  puis vous pourrez le publier depuis la liste des projets.
                </p>
              </Card>

              <Card className="p-6">
                <CreateProjectForm />
              </Card>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
