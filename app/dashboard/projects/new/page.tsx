import type { Metadata } from "next";
import Link from "next/link";
import { CreateProjectForm } from "@/components/dashboard/CreateProjectForm";

export const metadata: Metadata = {
  title: "Nouveau projet | Dashboard | Mon partenaire",
  description: "Créez un nouveau projet depuis votre espace dashboard.",
};

export default function DashboardCreateProjectPage() {
  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Nouveau projet</span>
        </div>
        <h1 className="text-3xl font-semibold">Créer un projet complet</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Renseignez les informations clés de votre projet. Il sera créé en brouillon,
          puis vous pourrez l&apos;activer depuis la vue d&apos;ensemble.
        </p>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <CreateProjectForm />
      </div>
    </section>
  );
}
