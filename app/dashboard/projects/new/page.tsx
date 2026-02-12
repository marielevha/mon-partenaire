import type { Metadata } from "next";
import Link from "next/link";
import { CreateProjectForm } from "@/components/dashboard/CreateProjectForm";
import { buildProjectFormPrefillFromTemplate } from "@/src/lib/document-templates";
import { getDocumentTemplateBySlugFromDatabase } from "@/src/lib/document-templates.server";

export const metadata: Metadata = {
  title: "Nouveau projet | Dashboard | Mon partenaire",
  description: "Créez un nouveau projet depuis votre espace dashboard.",
};

type DashboardCreateProjectPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function DashboardCreateProjectPage({
  searchParams,
}: DashboardCreateProjectPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const templateSlug =
    typeof resolvedSearchParams?.template === "string"
      ? resolvedSearchParams.template
      : "";
  const selectedTemplate = templateSlug
    ? await getDocumentTemplateBySlugFromDatabase(templateSlug)
    : undefined;
  const initialValues = selectedTemplate
    ? buildProjectFormPrefillFromTemplate(selectedTemplate)
    : undefined;

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
        {selectedTemplate ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent">
            <span>Modèle appliqué:</span>
            <span className="font-semibold">{selectedTemplate.title}</span>
            <Link href="/dashboard/projects/new" className="underline underline-offset-2">
              Retirer
            </Link>
          </p>
        ) : null}
        {!selectedTemplate && templateSlug ? (
          <p className="mt-3 rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
            Le modèle demandé est introuvable. Le formulaire standard a été chargé.
          </p>
        ) : null}
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <CreateProjectForm initialValues={initialValues} />
      </div>
    </section>
  );
}
