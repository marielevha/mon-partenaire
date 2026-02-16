import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { DocumentTemplateEditForm } from "@/components/dashboard/DocumentTemplateEditForm";
import prisma from "@/src/lib/prisma";
import { resolveS3DocumentPublicUrlFromStoredValue } from "@/src/lib/s3-storage";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier template | Dashboard | Mon partenaire",
  description: "Mettez à jour un template de document depuis votre dashboard.",
};

type TemplateEditRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  sectorTags: string[] | null;
  highlight: string;
  attachedDocumentPath: string | null;
  attachedDocumentName: string | null;
  attachedDocumentMimeType: string | null;
  attachedDocumentSizeBytes: number | null;
  isPublished: boolean;
  isFeatured: boolean;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isMissingDocumentTemplateTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return true;
  }

  const reason = error instanceof Error ? error.message : "";
  return (
    /DocumentTemplate|relation \"DocumentTemplate\" does not exist/i.test(reason) ||
    /attachedDocumentPath|attachedDocumentName|attachedDocumentMimeType|attachedDocumentSizeBytes/i.test(
      reason
    ) ||
    /code:\s*`42703`|column .* does not exist/i.test(reason)
  );
}

type DashboardDocumentTemplateEditPageProps = {
  params: Promise<{ templateId?: string }> | { templateId?: string };
};

export default async function DashboardDocumentTemplateEditPage({
  params,
}: DashboardDocumentTemplateEditPageProps) {
  const resolvedParams = await params;
  const templateId = resolvedParams.templateId ?? "";
  if (!templateId || !isUuid(templateId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  let template: TemplateEditRecord | null = null;
  let isMissingTable = false;

  try {
    const records = await prisma.$queryRaw<TemplateEditRecord[]>`
      SELECT
        "id",
        "title",
        "slug",
        "summary",
        "category"::text as "category",
        "level"::text as "level",
        "fileType"::text as "fileType",
        "objective"::text as "objective",
        "sectorTags",
        "highlight",
        "attachedDocumentPath",
        "attachedDocumentName",
        "attachedDocumentMimeType",
        "attachedDocumentSizeBytes",
        "isPublished",
        "isFeatured"
      FROM "DocumentTemplate"
      WHERE "id" = ${templateId}::uuid
        AND "ownerId" = ${session.user.id}
      LIMIT 1
    `;
    template = records[0] ?? null;
  } catch (error) {
    if (!isMissingDocumentTemplateTableError(error)) {
      throw error;
    }
    isMissingTable = true;
  }

  if (isMissingTable) {
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
            <span className="dashboard-muted">Modifier</span>
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Modifier un template</h1>
          <p className="dashboard-faint mt-2 max-w-3xl text-sm">
            Cette fonctionnalité nécessite la table DocumentTemplate.
          </p>
        </div>

        <div className="dashboard-panel rounded-2xl p-6">
          <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Schéma DocumentTemplate incomplet
            </p>
            <p className="mt-2 text-sm text-amber-700/90 dark:text-amber-200/90">
              Exécutez le script <code>supabase/document_templates.sql</code> dans le SQL
              Editor Supabase puis rechargez cette page.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!template) {
    notFound();
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
          <span className="dashboard-muted">Modifier</span>
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Modifier un template</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Mettez à jour les champs de votre modèle. Les changements publiés seront
          visibles dans la page Documents.
        </p>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <DocumentTemplateEditForm
          template={{
            ...template,
            sectorTags: template.sectorTags ?? [],
            attachedDocumentUrl: template.attachedDocumentPath
              ? resolveS3DocumentPublicUrlFromStoredValue(template.attachedDocumentPath)
              : null,
          }}
        />
      </div>
    </section>
  );
}
