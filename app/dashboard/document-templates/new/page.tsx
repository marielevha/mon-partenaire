import type { Metadata } from "next";
import Link from "next/link";
import { DocumentTemplateEditForm } from "@/components/dashboard/DocumentTemplateEditForm";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { requireCurrentUserPermission } from "@/src/lib/rbac/server";

export const metadata: Metadata = {
  title: "Nouveau template document | Dashboard | Mon partenaire",
  description: "Créez un template de document depuis votre dashboard.",
};

export default async function DashboardDocumentTemplateNewPage() {
  await requireCurrentUserPermission(
    RBAC_PERMISSIONS.DASHBOARD_DOCUMENT_TEMPLATES_CREATE,
    { redirectTo: "/dashboard/document-templates" }
  );

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/dashboard/document-templates"
            className="transition-colors hover:text-accent"
          >
            Templates documents
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Nouveau</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Ajouter un template document</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Créez un nouveau modèle avec ses métadonnées et sa pièce jointe. Il sera
          disponible dans votre bibliothèque après enregistrement.
        </p>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <DocumentTemplateEditForm mode="create" />
      </div>
    </section>
  );
}
