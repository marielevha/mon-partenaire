import {
  buildTemplateDraftContent,
  getDocumentTemplateBySlug,
} from "@/src/lib/document-templates";
import prisma from "@/src/lib/prisma";
import {
  fetchProjectDocumentObject,
  resolveS3ObjectKey,
} from "@/src/lib/s3-storage";
import { buildApiLogContext } from "@/src/lib/logging/http";
import { createLogger } from "@/src/lib/logging/logger";

type RouteParams = {
  slug?: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

type DocumentTemplateDownloadRecord = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  sectorTags: string[] | null;
  highlight: string;
  attachedDocumentPath: string | null;
  attachedDocumentName: string | null;
};

function mapDocumentTemplateRecord(record: DocumentTemplateDownloadRecord) {
  const categoryMap: Record<string, "Business & Strategie" | "Juridique & Creation" | "Finance & Investissement" | "Secteurs congolais"> = {
    BUSINESS_STRATEGY: "Business & Strategie",
    LEGAL_CREATION: "Juridique & Creation",
    FINANCE_INVESTMENT: "Finance & Investissement",
    LOCAL_SECTORS: "Secteurs congolais",
  };
  const levelMap: Record<string, "Debutant" | "Avance"> = {
    BEGINNER: "Debutant",
    ADVANCED: "Avance",
  };
  const fileTypeMap: Record<string, "PDF" | "DOCX" | "Editable online"> = {
    PDF: "PDF",
    DOCX: "DOCX",
    EDITABLE_ONLINE: "Editable online",
  };
  const objectiveMap: Record<
    string,
    "Creer entreprise" | "Lever des fonds" | "Formaliser partenariat"
  > = {
    CREATE_BUSINESS: "Creer entreprise",
    RAISE_FUNDS: "Lever des fonds",
    FORMALIZE_PARTNERSHIP: "Formaliser partenariat",
  };

  return {
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    category: categoryMap[record.category] ?? "Business & Strategie",
    level: levelMap[record.level] ?? "Debutant",
    fileType: fileTypeMap[record.fileType] ?? "DOCX",
    objective: objectiveMap[record.objective] ?? "Creer entreprise",
    sectorTags:
      record.sectorTags && record.sectorTags.length > 0
        ? record.sectorTags
        : ["Tous secteurs"],
    highlight: record.highlight,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  const logContext = buildApiLogContext(request, {
    route: "/api/document-templates/[slug]",
  });
  const routeLogger = createLogger(logContext);
  const requestUrl = new URL(request.url);
  const previewMode =
    requestUrl.searchParams.get("preview") === "1" ||
    requestUrl.searchParams.get("disposition") === "inline";
  const resolvedParams = await context.params;
  const slug = resolvedParams.slug ?? "";

  if (!slug) {
    routeLogger.warn("Document template download failed: missing slug");
    return new Response("Modele introuvable.", { status: 400 });
  }

  let record: DocumentTemplateDownloadRecord | null = null;

  try {
    const rows = await prisma.$queryRaw<DocumentTemplateDownloadRecord[]>`
      SELECT
        "slug",
        "title",
        "summary",
        "category"::text as "category",
        "level"::text as "level",
        "fileType"::text as "fileType",
        "objective"::text as "objective",
        "sectorTags",
        "highlight",
        "attachedDocumentPath",
        "attachedDocumentName"
      FROM "DocumentTemplate"
      WHERE "slug" = ${slug}
        AND "isPublished" = true
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    record = rows[0] ?? null;
  } catch {
    routeLogger.error("Document template query failed", { slug });
    record = null;
  }

  if (record?.attachedDocumentPath) {
    const objectKey = resolveS3ObjectKey(record.attachedDocumentPath);

    if (objectKey) {
      try {
        const upstream = await fetchProjectDocumentObject(objectKey);
        const fallbackName = sanitizeFileName(
          record.attachedDocumentName ||
            decodeURIComponent(objectKey.split("/").pop() || `${record.slug}.bin`)
        );
        const headers = new Headers();
        const contentType = upstream.headers.get("content-type");
        const contentLength = upstream.headers.get("content-length");
        const etag = upstream.headers.get("etag");
        const lastModified = upstream.headers.get("last-modified");

        if (contentType) headers.set("content-type", contentType);
        if (contentLength) headers.set("content-length", contentLength);
        if (etag) headers.set("etag", etag);
        if (lastModified) headers.set("last-modified", lastModified);
        headers.set(
          "content-disposition",
          previewMode
            ? `inline; filename="${fallbackName}"`
            : `attachment; filename="${fallbackName}"`
        );
        headers.set("cache-control", "private, max-age=300");

        return new Response(upstream.body, {
          status: 200,
          headers,
        });
      } catch {
        routeLogger.warn("Attached template document missing in storage", {
          slug,
          objectKey,
        });
        return new Response("Document joint introuvable.", { status: 404 });
      }
    }
  }

  const template = record ? mapDocumentTemplateRecord(record) : getDocumentTemplateBySlug(slug);
  if (!template) {
    routeLogger.warn("Template download failed: template not found", { slug });
    return new Response("Modele introuvable.", { status: 404 });
  }

  const body = buildTemplateDraftContent(template);
  const safeFileName = `${sanitizeFileName(template.slug || "modele")}.md`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": previewMode
        ? `inline; filename="${safeFileName}"`
        : `attachment; filename="${safeFileName}"`,
      "cache-control": "private, no-store",
    },
  });
}
