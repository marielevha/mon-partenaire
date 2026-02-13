"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { createProjectDraft } from "@/src/lib/projects";
import {
  PROJECT_NEED_TYPE_LABELS,
  type ProjectNeedType,
  normalizeProjectNeedType,
  splitSkillTags,
} from "@/src/lib/project-needs";
import {
  deleteProjectDocumentObjects,
  deleteProjectImageObjects,
  uploadProjectDocumentObject,
  uploadProjectImageObject,
} from "@/src/lib/s3-storage";

type ProjectFormSuccess = {
  ok: true;
  message: string;
  projectId: string;
};

type ProjectFormField =
  | "title"
  | "summary"
  | "description"
  | "category"
  | "city"
  | "totalCapital"
  | "ownerContribution"
  | "ownerEquityPercent"
  | "equityModel"
  | "visibility"
  | "projectImages"
  | "projectDocuments"
  | "projectNeeds";

type ProjectFormError = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<ProjectFormField, string>>;
};

export type ProjectFormState = ProjectFormSuccess | ProjectFormError | null;
export type CreateProjectState = ProjectFormState;
export type UpdateProjectState = ProjectFormState;

const PROJECT_CATEGORIES = [
  "AGRIBUSINESS",
  "TECH",
  "HEALTH",
  "EDUCATION",
  "INFRASTRUCTURE",
  "OTHER",
] as const;

const EQUITY_MODELS = ["NONE", "EQUITY", "REVENUE_SHARE"] as const;
const VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
const LEGAL_FORMS = ["SARL", "SA", "AUTOENTREPRENEUR", "OTHER"] as const;
const PROJECT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const MAX_PROJECT_IMAGES = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const MAX_PROJECT_DOCUMENTS = 20;
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/json",
]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".txt",
  ".json",
]);

type ProjectCategoryValue = (typeof PROJECT_CATEGORIES)[number];
type EquityModelValue = (typeof EQUITY_MODELS)[number];
type VisibilityValue = (typeof VISIBILITIES)[number];
type LegalFormValue = (typeof LEGAL_FORMS)[number];

type ProjectImageCreateManyDelegate = {
  createMany: (args: {
    data: Array<{
      projectId: string;
      storagePath: string;
      sortOrder: number;
      isCover: boolean;
    }>;
  }) => Promise<unknown>;
};

type ProjectDocumentCreateManyDelegate = {
  createMany: (args: {
    data: Array<{
      projectId: string;
      storagePath: string;
      originalName: string;
      mimeType: string | null;
      sizeBytes: number | null;
      sortOrder: number;
    }>;
  }) => Promise<unknown>;
};

type ParsedProjectFormData = {
  title: string;
  summary: string;
  description: string;
  category: ProjectCategoryValue;
  city: string;
  country: string;
  legalForm: LegalFormValue | null;
  companyCreated: boolean;
  totalCapital: number | null;
  ownerContribution: number | null;
  ownerEquityPercent: number | null;
  equityModel: EquityModelValue;
  equityNote: string | null;
  visibility: VisibilityValue;
  needs: ParsedProjectNeedInput[];
  imageFiles: File[];
  documentFiles: File[];
};

type ParsedProjectNeedInput = {
  type: ProjectNeedType;
  title: string;
  description: string | null;
  amount: number | null;
  requiredCount: number | null;
  equityPercent: number | null;
  skillTags: string[];
  isFilled: boolean;
};

type ProjectDocumentInsertData = {
  storagePath: string;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

type ParseProjectFormOptions = {
  currentImageCount?: number;
  currentDocumentCount?: number;
};

function getValue(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseUnknownOptionalInteger(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return Number.NaN;
    }
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseAndValidateProjectNeedsPayload(payload: string): {
  needs?: ParsedProjectNeedInput[];
  error?: string;
} {
  if (!payload) {
    return { needs: [] };
  }

  let rawNeeds: unknown;

  try {
    rawNeeds = JSON.parse(payload);
  } catch {
    return {
      error:
        "Format des besoins invalide. Rechargez la page et réessayez l'enregistrement.",
    };
  }

  if (!Array.isArray(rawNeeds)) {
    return {
      error:
        "Format des besoins invalide. Rechargez la page et réessayez l'enregistrement.",
    };
  }

  if (rawNeeds.length > 40) {
    return {
      error: "Vous pouvez enregistrer au maximum 40 besoins par projet.",
    };
  }

  const parsedNeeds: ParsedProjectNeedInput[] = [];

  for (const [index, rawNeed] of rawNeeds.entries()) {
    if (!rawNeed || typeof rawNeed !== "object") {
      return {
        error: `Le besoin #${index + 1} est invalide.`,
      };
    }

    const row = rawNeed as Record<string, unknown>;
    const type = normalizeProjectNeedType(String(row.type ?? ""));
    if (!type) {
      return {
        error: `Le type du besoin #${index + 1} est invalide.`,
      };
    }

    const titleInput = typeof row.title === "string" ? row.title.trim() : "";
    const title = titleInput || `${PROJECT_NEED_TYPE_LABELS[type]} #${index + 1}`;
    if (title.length > 140) {
      return {
        error: `Le titre du besoin #${index + 1} est trop long (140 caractères max).`,
      };
    }

    const description =
      typeof row.description === "string" && row.description.trim().length > 0
        ? row.description.trim()
        : null;
    const amount = parseUnknownOptionalInteger(row.amount);
    const requiredCount = parseUnknownOptionalInteger(row.requiredCount);
    const equityPercent = parseUnknownOptionalInteger(row.equityPercent);
    const skillTags = splitSkillTags(row.skillTags);
    const isFilled = row.isFilled === true;

    if (Number.isNaN(amount as number)) {
      return {
        error: `Le montant du besoin #${index + 1} est invalide.`,
      };
    }

    if (Number.isNaN(requiredCount as number)) {
      return {
        error: `Le nombre requis du besoin #${index + 1} est invalide.`,
      };
    }

    if (Number.isNaN(equityPercent as number)) {
      return {
        error: `Le pourcentage d'equity du besoin #${index + 1} est invalide.`,
      };
    }

    if (typeof equityPercent === "number" && (equityPercent < 0 || equityPercent > 100)) {
      return {
        error: `Le pourcentage d'equity du besoin #${index + 1} doit être compris entre 0 et 100.`,
      };
    }

    if (typeof amount === "number" && amount < 0) {
      return {
        error: `Le montant du besoin #${index + 1} doit être positif.`,
      };
    }

    if (typeof requiredCount === "number" && requiredCount < 1) {
      return {
        error: `Le nombre requis du besoin #${index + 1} doit être supérieur ou égal à 1.`,
      };
    }

    let normalizedAmount = amount;
    let normalizedRequiredCount = requiredCount;

    if (type === "FINANCIAL") {
      if (typeof normalizedAmount !== "number" || normalizedAmount <= 0) {
        return {
          error:
            `Besoin #${index + 1} (${PROJECT_NEED_TYPE_LABELS[type]}): le montant est obligatoire.`,
        };
      }

      if (normalizedRequiredCount === null) {
        normalizedRequiredCount = 1;
      }
    }

    if (type === "SKILL") {
      if (typeof normalizedRequiredCount !== "number" || normalizedRequiredCount <= 0) {
        return {
          error:
            `Besoin #${index + 1} (${PROJECT_NEED_TYPE_LABELS[type]}): le nombre de profils est obligatoire.`,
        };
      }

      normalizedAmount = null;
    }

    if (type === "MATERIAL" || type === "PARTNERSHIP") {
      if (!description || description.length < 6) {
        return {
          error:
            `Besoin #${index + 1} (${PROJECT_NEED_TYPE_LABELS[type]}): la description est obligatoire.`,
        };
      }

      normalizedAmount = null;
      normalizedRequiredCount = null;
    }

    parsedNeeds.push({
      type,
      title,
      description,
      amount: normalizedAmount,
      requiredCount: normalizedRequiredCount,
      equityPercent:
        type === "FINANCIAL" || type === "SKILL" ? equityPercent : null,
      skillTags: type === "SKILL" ? skillTags : [],
      isFilled,
    });
  }

  return { needs: parsedNeeds };
}

function getFileExtension(fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, "") ?? ""}`
    : "";
  return extension && extension.length <= 12 ? extension : "";
}

function isSupportedDocumentFile(file: File) {
  if (file.type && ALLOWED_DOCUMENT_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const extension = getFileExtension(file.name);
  return extension ? ALLOWED_DOCUMENT_EXTENSIONS.has(extension) : false;
}

function buildProjectImagePath(
  ownerId: string,
  projectId: string,
  file: File,
  index: number
) {
  const extension = getFileExtension(file.name);
  return `${ownerId}/${projectId}/images/${index + 1}-${crypto.randomUUID()}${extension}`;
}

function buildProjectDocumentPath(
  ownerId: string,
  projectId: string,
  file: File,
  index: number
) {
  const extension = getFileExtension(file.name);
  return `${ownerId}/${projectId}/documents/${index + 1}-${crypto.randomUUID()}${extension}`;
}

function parseAndValidateProjectForm(
  formData: FormData,
  options: ParseProjectFormOptions = {}
): { data?: ParsedProjectFormData; fieldErrors?: ProjectFormError["fieldErrors"] } {
  const { currentImageCount = 0, currentDocumentCount = 0 } = options;

  const title = getValue(formData, "title");
  const summary = getValue(formData, "summary");
  const description = getValue(formData, "description");
  const category = getValue(formData, "category");
  const city = getValue(formData, "city");
  const country = getValue(formData, "country") || "CG";
  const legalForm = getValue(formData, "legalForm");
  const equityModel = getValue(formData, "equityModel");
  const visibility = getValue(formData, "visibility");
  const equityNote = getValue(formData, "equityNote");
  const needsPayload = getValue(formData, "projectNeedsPayload");

  const companyCreated = formData.get("companyCreated") === "on";
  const totalCapital = parseOptionalNumber(getValue(formData, "totalCapital"));
  const ownerContribution = parseOptionalNumber(getValue(formData, "ownerContribution"));
  const ownerEquityPercent = parseOptionalNumber(
    getValue(formData, "ownerEquityPercent")
  );
  const imageFiles = formData
    .getAll("projectImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const documentFiles = formData
    .getAll("projectDocuments")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const parsedNeeds = parseAndValidateProjectNeedsPayload(needsPayload);

  const fieldErrors: ProjectFormError["fieldErrors"] = {};

  if (title.length < 4 || title.length > 120) {
    fieldErrors.title = "Le titre doit contenir entre 4 et 120 caractères.";
  }

  if (summary.length < 20 || summary.length > 220) {
    fieldErrors.summary = "Le résumé doit contenir entre 20 et 220 caractères.";
  }

  if (description.length < 80 || description.length > 6000) {
    fieldErrors.description = "La description doit contenir entre 80 et 6000 caractères.";
  }

  if (!PROJECT_CATEGORIES.includes(category as ProjectCategoryValue)) {
    fieldErrors.category = "Catégorie invalide.";
  }

  if (city.length < 2 || city.length > 80) {
    fieldErrors.city = "La ville doit contenir entre 2 et 80 caractères.";
  }

  if (!EQUITY_MODELS.includes(equityModel as EquityModelValue)) {
    fieldErrors.equityModel = "Modèle de partenariat invalide.";
  }

  if (!VISIBILITIES.includes(visibility as VisibilityValue)) {
    fieldErrors.visibility = "Visibilité invalide.";
  }

  if (
    Number.isNaN(totalCapital as number) ||
    (typeof totalCapital === "number" && totalCapital < 0)
  ) {
    fieldErrors.totalCapital = "Capital total invalide.";
  }

  if (
    Number.isNaN(ownerContribution as number) ||
    (typeof ownerContribution === "number" && ownerContribution < 0)
  ) {
    fieldErrors.ownerContribution = "Apport du porteur invalide.";
  }

  if (
    Number.isNaN(ownerEquityPercent as number) ||
    (typeof ownerEquityPercent === "number" &&
      (ownerEquityPercent < 0 || ownerEquityPercent > 100))
  ) {
    fieldErrors.ownerEquityPercent =
      "Le pourcentage des parts du porteur doit être entre 0 et 100.";
  }

  if (parsedNeeds.needs) {
    const ownerShare = typeof ownerEquityPercent === "number" ? ownerEquityPercent : 0;
    const needsShare = parsedNeeds.needs.reduce(
      (sum, need) => sum + (need.equityPercent ?? 0),
      0
    );
    const totalShare = ownerShare + needsShare;

    if (totalShare > 100) {
      const shareError =
        "La somme des parts (porteur + besoins) ne doit pas dépasser 100%.";
      fieldErrors.ownerEquityPercent = shareError;
      fieldErrors.projectNeeds = shareError;
    }
    if (totalShare < 100) {
      const shareError =
        "La somme des parts (porteur + besoins) ne doit pas être inférieure à 100%.";
      fieldErrors.ownerEquityPercent = shareError;
      fieldErrors.projectNeeds = shareError;
    }
  }

  if (
    typeof totalCapital === "number" &&
    typeof ownerContribution === "number" &&
    ownerContribution > totalCapital
  ) {
    fieldErrors.ownerContribution =
      "L'apport du porteur ne peut pas dépasser le capital total.";
  }

  if (currentImageCount + imageFiles.length > MAX_PROJECT_IMAGES) {
    fieldErrors.projectImages =
      currentImageCount > 0
        ? `Limite de ${MAX_PROJECT_IMAGES} images atteinte. Ce projet contient déjà ${currentImageCount} image(s).`
        : `Vous pouvez importer au maximum ${MAX_PROJECT_IMAGES} images.`;
  } else if (
    imageFiles.some((file) => !file.type || !ALLOWED_IMAGE_MIME_TYPES.has(file.type))
  ) {
    fieldErrors.projectImages = "Format image non supporté (JPG, PNG, WEBP, SVG).";
  } else if (imageFiles.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
    fieldErrors.projectImages = "Chaque image doit faire moins de 5 MB.";
  }

  if (currentDocumentCount + documentFiles.length > MAX_PROJECT_DOCUMENTS) {
    fieldErrors.projectDocuments =
      currentDocumentCount > 0
        ? `Limite de ${MAX_PROJECT_DOCUMENTS} documents atteinte. Ce projet contient déjà ${currentDocumentCount} document(s).`
        : `Vous pouvez importer au maximum ${MAX_PROJECT_DOCUMENTS} documents.`;
  } else if (documentFiles.some((file) => !isSupportedDocumentFile(file))) {
    fieldErrors.projectDocuments =
      "Format document non supporté (PDF, Word, Excel, PowerPoint, CSV, TXT, JSON).";
  } else if (documentFiles.some((file) => file.size > MAX_DOCUMENT_SIZE_BYTES)) {
    fieldErrors.projectDocuments = "Chaque document doit faire moins de 20 MB.";
  }

  if (!parsedNeeds.needs) {
    fieldErrors.projectNeeds =
      parsedNeeds.error || "Les besoins du projet sont invalides.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const normalizedCountry = country.slice(0, 2).toUpperCase() || "CG";
  const parsedLegalForm =
    legalForm && LEGAL_FORMS.includes(legalForm as LegalFormValue)
      ? (legalForm as LegalFormValue)
      : null;

  return {
    data: {
      title,
      summary,
      description,
      category: category as ProjectCategoryValue,
      city,
      country: normalizedCountry,
      legalForm: parsedLegalForm,
      companyCreated,
      totalCapital,
      ownerContribution,
      ownerEquityPercent,
      equityModel: equityModel as EquityModelValue,
      equityNote: equityNote || null,
      visibility: visibility as VisibilityValue,
      needs: parsedNeeds.needs ?? [],
      imageFiles,
      documentFiles,
    },
  };
}

type AssetInsertDb = Prisma.TransactionClient | typeof prisma;

async function insertProjectImageRecords(
  db: AssetInsertDb,
  projectId: string,
  storagePaths: string[],
  startSortOrder: number
) {
  const projectImageDelegate = (
    db as unknown as { projectImage?: ProjectImageCreateManyDelegate }
  ).projectImage;

  if (projectImageDelegate?.createMany) {
    await projectImageDelegate.createMany({
      data: storagePaths.map((storagePath, index) => ({
        projectId,
        storagePath,
        sortOrder: startSortOrder + index,
        isCover: startSortOrder + index === 0,
      })),
    });
    return;
  }

  for (const [index, storagePath] of storagePaths.entries()) {
    await db.$executeRaw`
      INSERT INTO "ProjectImage"
        ("id", "projectId", "storagePath", "sortOrder", "isCover", "createdAt")
      VALUES
        (${crypto.randomUUID()}, ${projectId}, ${storagePath}, ${startSortOrder + index}, ${startSortOrder + index === 0}, NOW())
    `;
  }
}

async function insertProjectDocumentRecords(
  db: AssetInsertDb,
  projectId: string,
  documents: ProjectDocumentInsertData[],
  startSortOrder: number
) {
  const projectDocumentDelegate = (
    db as unknown as { projectDocument?: ProjectDocumentCreateManyDelegate }
  ).projectDocument;

  if (projectDocumentDelegate?.createMany) {
    await projectDocumentDelegate.createMany({
      data: documents.map((document, index) => ({
        projectId,
        storagePath: document.storagePath,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        sortOrder: startSortOrder + index,
      })),
    });
    return;
  }

  for (const [index, document] of documents.entries()) {
    await db.$executeRaw`
      INSERT INTO "ProjectDocument"
        ("id", "projectId", "storagePath", "originalName", "mimeType", "sizeBytes", "sortOrder", "createdAt")
      VALUES
        (${crypto.randomUUID()}, ${projectId}, ${document.storagePath}, ${document.originalName}, ${document.mimeType}, ${document.sizeBytes}, ${startSortOrder + index}, NOW())
    `;
  }
}

async function uploadProjectImagesToStorage(
  ownerId: string,
  projectId: string,
  imageFiles: File[],
  startIndex: number
) {
  const uploadedObjectKeys: string[] = [];
  const uploadedStorageKeys: string[] = [];

  for (const [index, file] of imageFiles.entries()) {
    const objectKey = buildProjectImagePath(ownerId, projectId, file, startIndex + index);
    const { objectKey: uploadedObjectKey } = await uploadProjectImageObject(file, objectKey);
    uploadedObjectKeys.push(objectKey);
    uploadedStorageKeys.push(uploadedObjectKey);
  }

  return {
    uploadedObjectKeys,
    uploadedStorageKeys,
  };
}

async function uploadProjectDocumentsToStorage(
  ownerId: string,
  projectId: string,
  documentFiles: File[],
  startIndex: number
) {
  const uploadedObjectKeys: string[] = [];
  const uploadedDocuments: ProjectDocumentInsertData[] = [];

  for (const [index, file] of documentFiles.entries()) {
    const objectKey = buildProjectDocumentPath(ownerId, projectId, file, startIndex + index);
    const { objectKey: uploadedObjectKey } = await uploadProjectDocumentObject(file, objectKey);
    uploadedObjectKeys.push(objectKey);
    uploadedDocuments.push({
      storagePath: uploadedObjectKey,
      originalName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
  }

  return {
    uploadedObjectKeys,
    uploadedDocuments,
  };
}

async function normalizeProjectImageOrdering(db: AssetInsertDb, projectId: string) {
  await db.$executeRaw`
    WITH ordered AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
        ) - 1 AS new_sort
      FROM "ProjectImage"
      WHERE "projectId" = ${projectId}
    )
    UPDATE "ProjectImage" AS image
    SET
      "sortOrder" = ordered.new_sort,
      "isCover" = (ordered.new_sort = 0)
    FROM ordered
    WHERE image.id = ordered.id
  `;
}

async function normalizeProjectDocumentOrdering(db: AssetInsertDb, projectId: string) {
  await db.$executeRaw`
    WITH ordered AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          ORDER BY "sortOrder" ASC, "createdAt" ASC, id ASC
        ) - 1 AS new_sort
      FROM "ProjectDocument"
      WHERE "projectId" = ${projectId}
    )
    UPDATE "ProjectDocument" AS document
    SET
      "sortOrder" = ordered.new_sort
    FROM ordered
    WHERE document.id = ordered.id
  `;
}

async function updateProjectOwnerEquityPercent(
  db: AssetInsertDb,
  projectId: string,
  ownerEquityPercent: number | null
) {
  await db.$executeRaw`
    UPDATE "Project"
    SET "ownerEquityPercent" = ${ownerEquityPercent}
    WHERE "id" = ${projectId}
  `;
}

async function hasProjectNeedRequiredCountColumn() {
  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ProjectNeed'
          AND column_name = 'requiredCount'
      ) AS "exists"
    `;
    return rows[0]?.exists === true;
  } catch {
    return false;
  }
}

export async function upsertProjectNeeds(
  db: AssetInsertDb,
  projectId: string,
  needs: ParsedProjectNeedInput[]
) {
  await db.$executeRaw`
    DELETE FROM "ProjectNeed"
    WHERE "projectId" = ${projectId}
  `;

  if (needs.length === 0) {
    return;
  }

  for (const need of needs) {
    await db.$executeRaw`
      INSERT INTO "ProjectNeed"
        ("id", "projectId", "type", "title", "description", "amount", "requiredCount", "equityShare", "skillTags", "isFilled", "createdAt")
      VALUES
        (
          ${crypto.randomUUID()},
          ${projectId},
          ${need.type},
          ${need.title},
          ${need.description},
          ${need.amount},
          ${need.requiredCount},
          ${need.equityPercent},
          ${need.skillTags},
          ${need.isFilled},
          NOW()
        )
    `;
  }
}

function mapProjectAssetError(
  error: unknown,
  context: "image" | "document" | "mixed"
): ProjectFormError {
  const reason =
    error instanceof Error
      ? error.message
      : "Erreur inconnue pendant l'upload S3/MinIO.";

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  ) {
    if (context === "document") {
      return {
        ok: false,
        message:
          "La table ProjectDocument est absente dans la base. Exécutez le SQL de création de table puis réessayez.",
      };
    }

    if (context === "mixed") {
      return {
        ok: false,
        message:
          "Une table média est absente dans la base (ProjectImage/ProjectDocument). Exécutez le SQL d'initialisation puis réessayez.",
      };
    }

    return {
      ok: false,
      message:
        "La table ProjectImage est absente dans la base. Exécutez le SQL de création de table puis réessayez.",
    };
  }

  if (/Cannot read properties of undefined \(reading 'createMany'\)/i.test(reason)) {
    if (context === "document" || /ProjectDocument|projectDocument/i.test(reason)) {
      return {
        ok: false,
        message:
          "Client Prisma non synchronisé (projectDocument manquant). Exécutez `pnpm prisma generate`, redémarrez le serveur puis réessayez.",
      };
    }

    return {
      ok: false,
      message:
        "Client Prisma non synchronisé (projectImage manquant). Exécutez `pnpm prisma generate`, redémarrez le serveur puis réessayez.",
    };
  }

  if (/NoSuchBucket/i.test(reason)) {
    return {
      ok: false,
      message:
        "Le bucket S3/MinIO configuré est introuvable. Créez le bucket indiqué par S3_BUCKET puis réessayez.",
    };
  }

  if (/SignatureDoesNotMatch|AccessDenied|InvalidAccessKeyId/i.test(reason)) {
    return {
      ok: false,
      message:
        "Authentification S3/MinIO invalide. Vérifiez S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION et S3_ENDPOINT.",
    };
  }

  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed/i.test(reason)) {
    return {
      ok: false,
      message:
        "Impossible de joindre MinIO. Vérifiez S3_ENDPOINT (hôte/port), le conteneur MinIO et le réseau.",
    };
  }

  const scopeLabel =
    context === "image"
      ? "images"
      : context === "document"
        ? "documents"
        : "fichiers";

  console.error(`Project ${scopeLabel} upload failed:`, reason);

  return {
    ok: false,
    message:
      process.env.NODE_ENV === "development"
        ? `Impossible d'enregistrer les ${scopeLabel} du projet. Détail: ${reason}`
        : `Impossible d'enregistrer les ${scopeLabel} du projet. Vérifiez la configuration S3/MinIO et réessayez.`,
  };
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }

  const parsed = parseAndValidateProjectForm(formData);
  if (!parsed.data) {
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const input = parsed.data;
  const canPersistRequiredCount = await hasProjectNeedRequiredCountColumn();

  if (input.needs.length > 0 && !canPersistRequiredCount) {
    return {
      ok: false,
      message:
        "La colonne requiredCount est absente dans ProjectNeed. Exécutez le script SQL de mise à niveau puis réessayez.",
      fieldErrors: {
        projectNeeds:
          "La base ne supporte pas encore requiredCount sur ProjectNeed.",
      },
    };
  }
  const project = await createProjectDraft({
    ownerId: session.user.id,
    title: input.title,
    summary: input.summary,
    description: input.description,
    category: input.category,
    city: input.city,
    country: input.country,
    legalForm: input.legalForm,
    companyCreated: input.companyCreated,
    totalCapital: input.totalCapital,
    ownerContribution: input.ownerContribution,
    ownerEquityPercent: input.ownerEquityPercent,
    equityModel: input.equityModel,
    equityNote: input.equityNote,
    visibility: input.visibility,
  });

  let uploadedImageObjectKeys: string[] = [];
  let uploadedDocumentObjectKeys: string[] = [];
  let uploadedImageStorageKeys: string[] = [];
  let uploadedDocuments: ProjectDocumentInsertData[] = [];

  try {
    if (input.imageFiles.length > 0) {
      const imageUploadResult = await uploadProjectImagesToStorage(
        session.user.id,
        project.id,
        input.imageFiles,
        0
      );
      uploadedImageObjectKeys = imageUploadResult.uploadedObjectKeys;
      uploadedImageStorageKeys = imageUploadResult.uploadedStorageKeys;
    }

    if (input.documentFiles.length > 0) {
      const documentUploadResult = await uploadProjectDocumentsToStorage(
        session.user.id,
        project.id,
        input.documentFiles,
        0
      );
      uploadedDocumentObjectKeys = documentUploadResult.uploadedObjectKeys;
      uploadedDocuments = documentUploadResult.uploadedDocuments;
    }

    if (
      uploadedImageStorageKeys.length > 0 ||
      uploadedDocuments.length > 0 ||
      input.needs.length > 0
    ) {
      await prisma.$transaction(async (tx) => {
        if (uploadedImageStorageKeys.length > 0) {
          await insertProjectImageRecords(tx, project.id, uploadedImageStorageKeys, 0);
        }

        if (uploadedDocuments.length > 0) {
          await insertProjectDocumentRecords(tx, project.id, uploadedDocuments, 0);
        }

        if (input.needs.length > 0) {
          await upsertProjectNeeds(tx, project.id, input.needs);
        }
      });
    }
  } catch (error) {
    if (uploadedImageObjectKeys.length > 0) {
      await deleteProjectImageObjects(uploadedImageObjectKeys).catch(() => undefined);
    }

    if (uploadedDocumentObjectKeys.length > 0) {
      await deleteProjectDocumentObjects(uploadedDocumentObjectKeys).catch(() => undefined);
    }

    await prisma.project
      .delete({
        where: { id: project.id },
      })
      .catch(() => undefined);

    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    if (
      input.needs.length > 0 &&
      (reason.includes("requiredCount") || reason.includes("ProjectNeed"))
    ) {
      return {
        ok: false,
        message:
          "Impossible d'enregistrer les besoins du projet. Vérifiez la structure de la table ProjectNeed.",
        fieldErrors: {
          projectNeeds:
            "La sauvegarde des besoins a échoué (requiredCount/ProjectNeed).",
        },
      };
    }

    const context =
      input.imageFiles.length > 0 && input.documentFiles.length > 0
        ? "mixed"
        : input.documentFiles.length > 0
          ? "document"
          : input.imageFiles.length > 0
            ? "image"
            : "mixed";

    return mapProjectAssetError(error, context);
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");

  return {
    ok: true,
    message: "Projet créé avec succès. Vous pouvez maintenant ajouter les besoins.",
    projectId: project.id,
  };
}

type ProjectDocumentStorageRecord = {
  id: string;
  storagePath: string;
};

function isMissingProjectDocumentTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return true;
  }

  const reason = error instanceof Error ? error.message : "";
  return /ProjectDocument|relation \"ProjectDocument\" does not exist/i.test(reason);
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return {
        ok: false,
        message: "Session invalide. Reconnectez-vous.",
      };
    }

    const projectId = getValue(formData, "projectId");
    if (!projectId) {
      return {
        ok: false,
        message: "Projet introuvable.",
      };
    }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      images: {
        select: {
          id: true,
          storagePath: true,
        },
      },
      _count: {
        select: {
          images: true,
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      message: "Projet introuvable ou accès refusé.",
    };
  }

  let hasProjectDocumentTable = true;
  let existingDocuments: ProjectDocumentStorageRecord[] = [];
  let existingDocumentsQueryError: unknown = null;

  try {
    existingDocuments = await prisma.$queryRaw<ProjectDocumentStorageRecord[]>`
      SELECT "id", "storagePath"
      FROM "ProjectDocument"
      WHERE "projectId" = ${project.id}
      ORDER BY "sortOrder" ASC, "createdAt" ASC
    `;
  } catch (error) {
    if (!isMissingProjectDocumentTableError(error)) {
      existingDocumentsQueryError = error;
    } else {
      hasProjectDocumentTable = false;
    }
  }

  if (existingDocumentsQueryError) {
    const reason =
      existingDocumentsQueryError instanceof Error
        ? existingDocumentsQueryError.message
        : "Erreur inconnue.";
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les documents du projet. Détail: ${reason}`
          : "Impossible de charger les documents du projet pour le moment.",
    };
  }

  const removeImageIds = formData
    .getAll("removeImageIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const removeDocumentIds = formData
    .getAll("removeDocumentIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (!hasProjectDocumentTable && removeDocumentIds.length > 0) {
    return {
      ok: false,
      message:
        "La table ProjectDocument est absente dans la base. Exécutez le SQL de création de table puis réessayez.",
    };
  }

  const removableImages = project.images.filter((image) => removeImageIds.includes(image.id));
  const removableDocuments = existingDocuments.filter((document) =>
    removeDocumentIds.includes(document.id)
  );

  const projectedExistingImageCount = project._count.images - removableImages.length;
  const projectedExistingDocumentCount =
    existingDocuments.length - removableDocuments.length;

  const parsed = parseAndValidateProjectForm(formData, {
    currentImageCount: projectedExistingImageCount,
    currentDocumentCount: projectedExistingDocumentCount,
  });

  if (!parsed.data) {
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const input = parsed.data;
  const canPersistRequiredCount = await hasProjectNeedRequiredCountColumn();

  if (input.needs.length > 0 && !canPersistRequiredCount) {
    return {
      ok: false,
      message:
        "La colonne requiredCount est absente dans ProjectNeed. Exécutez le script SQL de mise à niveau puis réessayez.",
      fieldErrors: {
        projectNeeds:
          "La base ne supporte pas encore requiredCount sur ProjectNeed.",
      },
    };
  }

  if (!hasProjectDocumentTable && input.documentFiles.length > 0) {
    return {
      ok: false,
      message:
        "La table ProjectDocument est absente dans la base. Exécutez le SQL de création de table puis réessayez.",
    };
  }

  let uploadedImageObjectKeys: string[] = [];
  let uploadedDocumentObjectKeys: string[] = [];
  let uploadedImageStorageKeys: string[] = [];
  let uploadedDocuments: ProjectDocumentInsertData[] = [];

  try {
    if (input.imageFiles.length > 0) {
      const imageUploadResult = await uploadProjectImagesToStorage(
        session.user.id,
        project.id,
        input.imageFiles,
        projectedExistingImageCount
      );
      uploadedImageObjectKeys = imageUploadResult.uploadedObjectKeys;
      uploadedImageStorageKeys = imageUploadResult.uploadedStorageKeys;
    }

    if (input.documentFiles.length > 0 && hasProjectDocumentTable) {
      const documentUploadResult = await uploadProjectDocumentsToStorage(
        session.user.id,
        project.id,
        input.documentFiles,
        projectedExistingDocumentCount
      );
      uploadedDocumentObjectKeys = documentUploadResult.uploadedObjectKeys;
      uploadedDocuments = documentUploadResult.uploadedDocuments;
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    if (
      input.needs.length > 0 &&
      (reason.includes("requiredCount") || reason.includes("ProjectNeed"))
    ) {
      return {
        ok: false,
        message:
          "Impossible de préparer la mise à jour des besoins du projet.",
        fieldErrors: {
          projectNeeds:
            "La validation/sauvegarde des besoins a échoué. Vérifiez les champs.",
        },
      };
    }

    const context =
      input.imageFiles.length > 0 && input.documentFiles.length > 0
        ? "mixed"
        : input.documentFiles.length > 0
          ? "document"
          : input.imageFiles.length > 0
            ? "image"
            : "mixed";

    return mapProjectAssetError(error, context);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: {
          id: project.id,
        },
        data: {
          title: input.title,
          summary: input.summary,
          description: input.description,
          category: input.category,
          city: input.city,
          country: input.country,
          legalForm: input.legalForm,
          companyCreated: input.companyCreated,
          totalCapital: input.totalCapital,
          ownerContribution: input.ownerContribution,
          equityModel: input.equityModel,
          equityNote: input.equityNote,
          visibility: input.visibility,
        },
      });
      await updateProjectOwnerEquityPercent(tx, project.id, input.ownerEquityPercent);

      if (removableImages.length > 0) {
        await tx.$executeRaw`
          DELETE FROM "ProjectImage"
          WHERE "projectId" = ${project.id}
            AND "id" IN (${Prisma.join(removableImages.map((image) => image.id))})
        `;
      }

      if (hasProjectDocumentTable && removableDocuments.length > 0) {
        await tx.$executeRaw`
          DELETE FROM "ProjectDocument"
          WHERE "projectId" = ${project.id}
            AND "id" IN (${Prisma.join(removableDocuments.map((document) => document.id))})
        `;
      }

      if (uploadedImageStorageKeys.length > 0) {
        await insertProjectImageRecords(
          tx,
          project.id,
          uploadedImageStorageKeys,
          projectedExistingImageCount
        );
      }

      if (hasProjectDocumentTable && uploadedDocuments.length > 0) {
        await insertProjectDocumentRecords(
          tx,
          project.id,
          uploadedDocuments,
          projectedExistingDocumentCount
        );
      }

      await normalizeProjectImageOrdering(tx, project.id);
      if (hasProjectDocumentTable) {
        await normalizeProjectDocumentOrdering(tx, project.id);
      }

      await upsertProjectNeeds(tx, project.id, input.needs);
    });
  } catch (error) {
    if (uploadedImageObjectKeys.length > 0) {
      await deleteProjectImageObjects(uploadedImageObjectKeys).catch(() => undefined);
    }

    if (uploadedDocumentObjectKeys.length > 0) {
      await deleteProjectDocumentObjects(uploadedDocumentObjectKeys).catch(() => undefined);
    }

    const context =
      uploadedImageStorageKeys.length > 0 && uploadedDocuments.length > 0
        ? "mixed"
        : uploadedDocuments.length > 0
          ? "document"
          : "image";

    if (uploadedImageStorageKeys.length > 0 || uploadedDocuments.length > 0) {
      return mapProjectAssetError(error, context);
    }

    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    if (
      input.needs.length > 0 &&
      (reason.includes("requiredCount") || reason.includes("ProjectNeed"))
    ) {
      return {
        ok: false,
        message:
          "Impossible d'enregistrer les besoins du projet. Vérifiez la structure de ProjectNeed.",
        fieldErrors: {
          projectNeeds:
            "La sauvegarde des besoins a échoué (requiredCount/ProjectNeed).",
        },
      };
    }

    console.error("Project update failed:", reason);
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de mettre à jour le projet. Détail: ${reason}`
          : "Impossible de mettre à jour le projet pour le moment.",
    };
  }

  if (removableImages.length > 0) {
    await deleteProjectImageObjects(removableImages.map((image) => image.storagePath)).catch(
      (error) => {
        const reason = error instanceof Error ? error.message : "Erreur inconnue.";
        console.error("Failed to delete removed project images from storage:", reason);
      }
    );
  }

  if (hasProjectDocumentTable && removableDocuments.length > 0) {
    await deleteProjectDocumentObjects(
      removableDocuments.map((document) => document.storagePath)
    ).catch((error) => {
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      console.error("Failed to delete removed project documents from storage:", reason);
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${project.id}/edit`);
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/projects");

    return {
      ok: true,
      message: "Projet mis à jour avec succès.",
      projectId: project.id,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    console.error("Unexpected project update server action failure:", reason);

    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de mettre à jour le projet. Détail: ${reason}`
          : "Impossible de mettre à jour le projet pour le moment. Réessayez.",
    };
  }
}

export async function updateProjectStatusAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return;
  }

  const projectId = getValue(formData, "projectId");
  const status = getValue(formData, "status");

  if (!projectId) {
    return;
  }

  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    return;
  }

  if (status === "ARCHIVED") {
    const closureRows = await prisma.$queryRaw<
      Array<{
        ownerEquityPercent: number | null;
        needsSharePercent: unknown;
      }>
    >`
      SELECT
        p."ownerEquityPercent",
        COALESCE(SUM(n."equityShare"), 0) AS "needsSharePercent"
      FROM "Project" p
      LEFT JOIN "ProjectNeed" n
        ON n."projectId" = p."id"
      WHERE p."id" = ${projectId}
        AND p."ownerId" = ${session.user.id}
      GROUP BY p."id", p."ownerEquityPercent"
    `;

    if (closureRows.length === 0) {
      return;
    }

    const closureRow = closureRows[0];
    const ownerSharePercent = closureRow.ownerEquityPercent ?? 0;
    const parsedNeedsSharePercent =
      typeof closureRow.needsSharePercent === "number"
        ? closureRow.needsSharePercent
        : Number.parseInt(String(closureRow.needsSharePercent ?? "0"), 10);
    const needsSharePercent = Number.isFinite(parsedNeedsSharePercent)
      ? parsedNeedsSharePercent
      : 0;
    const totalAllocatedShare = ownerSharePercent + needsSharePercent;

    if (totalAllocatedShare !== 100) {
      console.warn(
        `Project ${projectId} cannot be archived: equity allocation is ${totalAllocatedShare}% (expected 100%).`
      );
      return;
    }
  }

  await prisma.project.updateMany({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    data: {
      status: status as (typeof PROJECT_STATUSES)[number],
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}
