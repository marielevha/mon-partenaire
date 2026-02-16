import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentTemplateEditForm } from "@/components/dashboard/DocumentTemplateEditForm";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nouveau template document | Dashboard | Mon partenaire",
  description: "Créez un template de document depuis votre dashboard.",
};

export default async function DashboardDocumentTemplateNewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

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

