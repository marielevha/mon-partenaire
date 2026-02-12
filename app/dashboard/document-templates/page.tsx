import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { DocumentTemplatesDataTable } from "@/components/dashboard/DocumentTemplatesDataTable";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Templates documents | Dashboard | Mon partenaire",
  description: "Consultez la liste des templates de documents créés depuis votre espace.",
};

type TemplateListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function isMissingDocumentTemplateTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return true;
  }

  const reason = error instanceof Error ? error.message : "";
  return /DocumentTemplate|relation \"DocumentTemplate\" does not exist/i.test(reason);
}

export default async function DashboardDocumentTemplatesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  let templates: TemplateListItem[] = [];
  let isMissingTable = false;

  try {
    templates = await prisma.$queryRaw<TemplateListItem[]>`
      SELECT
        "id",
        "slug",
        "title",
        "summary",
        "category"::text as "category",
        "level"::text as "level",
        "fileType"::text as "fileType",
        "objective"::text as "objective",
        "isPublished",
        "isFeatured",
        "createdAt",
        "updatedAt"
      FROM "DocumentTemplate"
      WHERE "ownerId" = ${session.user.id}
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    `;
  } catch (error) {
    if (!isMissingDocumentTemplateTableError(error)) {
      throw error;
    }
    isMissingTable = true;
  }

  const serializedTemplates = templates.map((template) => ({
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }));

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Templates documents</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Templates de documents</h1>
            <p className="dashboard-faint mt-2 max-w-3xl text-sm">
              Consultez les modèles que vous avez créés et suivez leur statut de
              publication.
            </p>
          </div>
          <Link
            href="/dashboard/document-templates/new"
            className="dashboard-btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Ajouter un document
          </Link>
        </div>
      </div>

      {isMissingTable ? (
        <div className="dashboard-panel rounded-2xl p-6">
          <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Table DocumentTemplate absente
            </p>
            <p className="mt-2 text-sm text-amber-700/90 dark:text-amber-200/90">
              Exécutez le script <code>supabase/document_templates.sql</code> dans le SQL
              Editor Supabase pour activer cette page.
            </p>
          </div>
        </div>
      ) : (
        <DocumentTemplatesDataTable templates={serializedTemplates} />
      )}
    </section>
  );
}
