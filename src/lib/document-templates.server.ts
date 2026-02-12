import "server-only";

import {
  Prisma,
} from "@prisma/client";
import prisma from "@/src/lib/prisma";
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  getDocumentTemplateBySlug,
  type DocumentTemplate,
} from "@/src/lib/document-templates";

type DocumentTemplateRecord = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  sectorTags: string[] | null;
  highlight: string;
};

function mapDocumentTemplateRecord(record: DocumentTemplateRecord): DocumentTemplate {
  const categoryMap: Record<string, DocumentTemplate["category"]> = {
    BUSINESS_STRATEGY: "Business & Strategie",
    LEGAL_CREATION: "Juridique & Creation",
    FINANCE_INVESTMENT: "Finance & Investissement",
    LOCAL_SECTORS: "Secteurs congolais",
  };
  const levelMap: Record<string, DocumentTemplate["level"]> = {
    BEGINNER: "Debutant",
    ADVANCED: "Avance",
  };
  const fileTypeMap: Record<string, DocumentTemplate["fileType"]> = {
    PDF: "PDF",
    DOCX: "DOCX",
    EDITABLE_ONLINE: "Editable online",
  };
  const objectiveMap: Record<string, DocumentTemplate["objective"]> = {
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
    sectorTags: record.sectorTags && record.sectorTags.length > 0 ? record.sectorTags : ["Tous secteurs"],
    highlight: record.highlight,
  };
}

function isMissingDocumentTemplateTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return true;
  }

  const reason = error instanceof Error ? error.message : "";
  return /DocumentTemplate|relation \"DocumentTemplate\" does not exist/i.test(reason);
}

export async function getDocumentTemplatesForLibrary(): Promise<DocumentTemplate[]> {
  try {
    const records = await prisma.$queryRaw<DocumentTemplateRecord[]>`
      SELECT
        "slug",
        "title",
        "summary",
        "category"::text as "category",
        "level"::text as "level",
        "fileType"::text as "fileType",
        "objective"::text as "objective",
        "sectorTags",
        "highlight"
      FROM "DocumentTemplate"
      WHERE "isPublished" = true
      ORDER BY "isFeatured" DESC, "createdAt" DESC
    `;

    if (records.length === 0) {
      return DEFAULT_DOCUMENT_TEMPLATES;
    }

    return records.map(mapDocumentTemplateRecord);
  } catch (error) {
    if (isMissingDocumentTemplateTableError(error)) {
      return DEFAULT_DOCUMENT_TEMPLATES;
    }
    throw error;
  }
}

export async function getDocumentTemplateBySlugFromDatabase(
  slug: string
): Promise<DocumentTemplate | undefined> {
  if (!slug) {
    return undefined;
  }

  try {
    const records = await prisma.$queryRaw<DocumentTemplateRecord[]>`
      SELECT
        "slug",
        "title",
        "summary",
        "category"::text as "category",
        "level"::text as "level",
        "fileType"::text as "fileType",
        "objective"::text as "objective",
        "sectorTags",
        "highlight"
      FROM "DocumentTemplate"
      WHERE "slug" = ${slug}
        AND "isPublished" = true
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    const record = records[0];

    if (record) {
      return mapDocumentTemplateRecord(record);
    }
  } catch (error) {
    if (!isMissingDocumentTemplateTableError(error)) {
      throw error;
    }
  }

  return getDocumentTemplateBySlug(slug);
}
