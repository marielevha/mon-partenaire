"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import {
  deleteProjectDocumentObjects,
  uploadProjectDocumentObject,
} from "@/src/lib/s3-storage";
import { getServerActionLogger } from "@/src/lib/logging/server-action";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type DocumentTemplateField =
  | "title"
  | "slug"
  | "summary"
  | "category"
  | "level"
  | "fileType"
  | "objective"
  | "sectorTags"
  | "highlight"
  | "attachedDocument";

type DocumentTemplateFormSuccess = {
  ok: true;
  message: string;
};

type DocumentTemplateFormError = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<DocumentTemplateField, string>>;
};

export type DocumentTemplateFormState =
  | DocumentTemplateFormSuccess
  | DocumentTemplateFormError
  | null;

const CATEGORIES = [
  "BUSINESS_STRATEGY",
  "LEGAL_CREATION",
  "FINANCE_INVESTMENT",
  "LOCAL_SECTORS",
] as const;

const LEVELS = ["BEGINNER", "ADVANCED"] as const;
const FILE_TYPES = ["PDF", "DOCX", "EDITABLE_ONLINE"] as const;
const OBJECTIVES = ["CREATE_BUSINESS", "RAISE_FUNDS", "FORMALIZE_PARTNERSHIP"] as const;
const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
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
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
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

type CategoryValue = (typeof CATEGORIES)[number];
type LevelValue = (typeof LEVELS)[number];
type FileTypeValue = (typeof FILE_TYPES)[number];
type ObjectiveValue = (typeof OBJECTIVES)[number];

type UpdateFieldChange = {
  column: string;
  oldValue: unknown;
  newValue: unknown;
};

function getValue(formData: FormData, key: string) {
  const rawValue = formData.get(key);
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isDocumentTemplateAttachmentSchemaError(error: unknown) {
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

function isDocumentTemplateSlugConflictError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return true;
  }

  const reason = error instanceof Error ? error.message : "";
  return (
    /duplicate key value violates unique constraint/i.test(reason) &&
    /DocumentTemplate_slug_key|\"slug\"/i.test(reason)
  );
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getFileExtension(fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName
        .split(".")
        .pop()
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]/g, "") ?? ""}`
    : "";
  return extension && extension.length <= 12 ? extension : "";
}

function isSupportedAttachmentFile(file: File) {
  if (file.type && ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const extension = getFileExtension(file.name);
  return extension ? ALLOWED_ATTACHMENT_EXTENSIONS.has(extension) : false;
}

function buildTemplateDocumentPath(ownerId: string, templateId: string, file: File) {
  const extension = getFileExtension(file.name);
  return `${ownerId}/document-templates/${templateId}/${crypto.randomUUID()}${extension}`;
}

function parseSectorTags(rawValue: string) {
  if (!rawValue.trim()) {
    return ["Tous secteurs"];
  }

  const tags = rawValue
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const uniqueTags: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueTags.push(tag);
  }

  return uniqueTags;
}

function areStringArraysEqual(left: string[] | null, right: string[] | null) {
  const normalizedLeft = left ?? [];
  const normalizedRight = right ?? [];

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  for (let index = 0; index < normalizedLeft.length; index += 1) {
    if (normalizedLeft[index] !== normalizedRight[index]) {
      return false;
    }
  }

  return true;
}

function appendFieldChange(
  changes: UpdateFieldChange[],
  column: string,
  oldValue: unknown,
  newValue: unknown
) {
  const normalizedOld = oldValue ?? null;
  const normalizedNew = newValue ?? null;

  if (Array.isArray(normalizedOld) || Array.isArray(normalizedNew)) {
    const oldArray = Array.isArray(normalizedOld)
      ? (normalizedOld as string[])
      : normalizedOld === null
        ? []
        : [String(normalizedOld)];
    const newArray = Array.isArray(normalizedNew)
      ? (normalizedNew as string[])
      : normalizedNew === null
        ? []
        : [String(normalizedNew)];

    if (areStringArraysEqual(oldArray, newArray)) {
      return;
    }

    changes.push({
      column,
      oldValue: oldArray,
      newValue: newArray,
    });
    return;
  }

  if (normalizedOld === normalizedNew) {
    return;
  }

  changes.push({
    column,
    oldValue: normalizedOld,
    newValue: normalizedNew,
  });
}

type ParsedTemplateData = {
  title: string;
  slug: string;
  summary: string;
  category: CategoryValue;
  level: LevelValue;
  fileType: FileTypeValue;
  objective: ObjectiveValue;
  sectorTags: string[];
  highlight: string;
  isPublished: boolean;
  isFeatured: boolean;
};

function parseTemplateForm(formData: FormData): {
  data?: ParsedTemplateData;
  fieldErrors?: DocumentTemplateFormError["fieldErrors"];
} {
  const title = getValue(formData, "title");
  const slug = normalizeSlug(getValue(formData, "slug"));
  const summary = getValue(formData, "summary");
  const category = getValue(formData, "category");
  const level = getValue(formData, "level");
  const fileType = getValue(formData, "fileType");
  const objective = getValue(formData, "objective");
  const sectorTags = parseSectorTags(getValue(formData, "sectorTags"));
  const highlight = getValue(formData, "highlight");
  const isPublished = formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "on";

  const fieldErrors: DocumentTemplateFormError["fieldErrors"] = {};

  if (title.length < 4 || title.length > 140) {
    fieldErrors.title = "Le titre doit contenir entre 4 et 140 caractères.";
  }

  if (slug.length < 3) {
    fieldErrors.slug = "Slug invalide (minimum 3 caractères alphanumériques).";
  }

  if (summary.length < 20 || summary.length > 500) {
    fieldErrors.summary = "Le résumé doit contenir entre 20 et 500 caractères.";
  }

  if (!CATEGORIES.includes(category as CategoryValue)) {
    fieldErrors.category = "Catégorie invalide.";
  }

  if (!LEVELS.includes(level as LevelValue)) {
    fieldErrors.level = "Niveau invalide.";
  }

  if (!FILE_TYPES.includes(fileType as FileTypeValue)) {
    fieldErrors.fileType = "Type de fichier invalide.";
  }

  if (!OBJECTIVES.includes(objective as ObjectiveValue)) {
    fieldErrors.objective = "Objectif invalide.";
  }

  if (sectorTags.length === 0) {
    fieldErrors.sectorTags = "Ajoutez au moins un secteur.";
  } else if (sectorTags.length > 12) {
    fieldErrors.sectorTags = "Maximum 12 secteurs.";
  } else if (sectorTags.some((tag) => tag.length < 2 || tag.length > 40)) {
    fieldErrors.sectorTags = "Chaque secteur doit contenir entre 2 et 40 caractères.";
  }

  if (highlight.length < 10 || highlight.length > 320) {
    fieldErrors.highlight = "Le point clé doit contenir entre 10 et 320 caractères.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      title,
      slug,
      summary,
      category: category as CategoryValue,
      level: level as LevelValue,
      fileType: fileType as FileTypeValue,
      objective: objective as ObjectiveValue,
      sectorTags,
      highlight,
      isPublished,
      isFeatured,
    },
  };
}

export async function createDocumentTemplateAction(
  _prevState: DocumentTemplateFormState,
  formData: FormData
): Promise<DocumentTemplateFormState> {
  const actionLogger = await getServerActionLogger("dashboard.document-template.create");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    actionLogger
      .child({ userId: "anonymous" })
      .warn("Create document template rejected: invalid session");
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }
  const userLogger = actionLogger.child({ userId: session.user.id });

  const parsed = parseTemplateForm(formData);
  if (!parsed.data) {
    userLogger.warn("Create document template validation failed", {
      fields: Object.keys(parsed.fieldErrors ?? {}),
    });
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  let sameSlugRecords: Array<{ id: string }> = [];
  try {
    sameSlugRecords = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "DocumentTemplate"
      WHERE "slug" = ${parsed.data.slug}
      LIMIT 1
    `;
  } catch (error) {
    userLogger.error("Create document template failed while checking slug", {
      error,
    });
    if (isDocumentTemplateAttachmentSchemaError(error)) {
      return {
        ok: false,
        message:
          "Le schéma DocumentTemplate est incomplet. Exécutez supabase/document_templates.sql puis réessayez.",
      };
    }
    throw error;
  }

  if (sameSlugRecords.length > 0) {
    userLogger.warn("Create document template rejected: slug already exists", {
      slug: parsed.data.slug,
    });
    return {
      ok: false,
      message: "Impossible d'enregistrer ce slug.",
      fieldErrors: {
        slug: "Ce slug existe déjà. Choisissez-en un autre.",
      },
    };
  }

  const attachmentRaw = formData.get("attachedDocument");
  const attachmentFile =
    attachmentRaw instanceof File && attachmentRaw.size > 0 ? attachmentRaw : null;

  if (attachmentFile) {
    if (!isSupportedAttachmentFile(attachmentFile)) {
      userLogger.warn("Create document template rejected: unsupported attachment", {
        fileName: attachmentFile.name,
        mimeType: attachmentFile.type,
      });
      return {
        ok: false,
        message: "Le document joint est invalide.",
        fieldErrors: {
          attachedDocument:
            "Format non supporté (PDF, Word, Excel, PowerPoint, CSV, TXT, JSON).",
        },
      };
    }

    if (attachmentFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
      userLogger.warn("Create document template rejected: attachment too large", {
        fileName: attachmentFile.name,
        sizeBytes: attachmentFile.size,
      });
      return {
        ok: false,
        message: "Le document joint est trop volumineux.",
        fieldErrors: {
          attachedDocument: "Le fichier doit faire moins de 20 MB.",
        },
      };
    }
  }

  const templateId = crypto.randomUUID();
  let uploadedAttachmentObjectKey: string | null = null;
  let attachedDocumentPath: string | null = null;
  let attachedDocumentName: string | null = null;
  let attachedDocumentMimeType: string | null = null;
  let attachedDocumentSizeBytes: number | null = null;

  if (attachmentFile) {
    try {
      const attachmentKey = buildTemplateDocumentPath(
        session.user.id,
        templateId,
        attachmentFile
      );
      const uploadResult = await uploadProjectDocumentObject(attachmentFile, attachmentKey);
      uploadedAttachmentObjectKey = uploadResult.objectKey;
      attachedDocumentPath = uploadResult.objectKey;
      attachedDocumentName = attachmentFile.name;
      attachedDocumentMimeType = attachmentFile.type || null;
      attachedDocumentSizeBytes = attachmentFile.size;
    } catch (error) {
      userLogger.error("Create document template attachment upload failed", {
        error,
      });
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      return {
        ok: false,
        message:
          process.env.NODE_ENV === "development"
            ? `Impossible d'envoyer le document joint. Détail: ${reason}`
            : "Impossible d'envoyer le document joint. Vérifiez la configuration S3/MinIO.",
      };
    }
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO "DocumentTemplate" (
        "id",
        "ownerId",
        "slug",
        "title",
        "summary",
        "category",
        "level",
        "fileType",
        "objective",
        "sectorTags",
        "highlight",
        "attachedDocumentPath",
        "attachedDocumentName",
        "attachedDocumentMimeType",
        "attachedDocumentSizeBytes",
        "isPublished",
        "isFeatured",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${templateId}::uuid,
        ${session.user.id},
        ${parsed.data.slug},
        ${parsed.data.title},
        ${parsed.data.summary},
        ${parsed.data.category}::"DocumentTemplateCategory",
        ${parsed.data.level}::"DocumentTemplateLevel",
        ${parsed.data.fileType}::"DocumentTemplateFileType",
        ${parsed.data.objective}::"DocumentTemplateObjective",
        ${parsed.data.sectorTags},
        ${parsed.data.highlight},
        ${attachedDocumentPath},
        ${attachedDocumentName},
        ${attachedDocumentMimeType},
        ${attachedDocumentSizeBytes},
        ${parsed.data.isPublished},
        ${parsed.data.isFeatured},
        NOW(),
        NOW()
      )
    `;
  } catch (error) {
    if (uploadedAttachmentObjectKey) {
      await deleteProjectDocumentObjects([uploadedAttachmentObjectKey]).catch(
        () => undefined
      );
    }

    if (isDocumentTemplateSlugConflictError(error)) {
      userLogger.warn("Create document template rejected: slug conflict on insert", {
        slug: parsed.data.slug,
      });
      return {
        ok: false,
        message: "Impossible d'enregistrer ce slug.",
        fieldErrors: {
          slug: "Ce slug existe déjà. Choisissez-en un autre.",
        },
      };
    }

    if (isDocumentTemplateAttachmentSchemaError(error)) {
      userLogger.warn("Create document template rejected: missing schema columns");
      return {
        ok: false,
        message:
          "Le schéma DocumentTemplate est incomplet. Exécutez supabase/document_templates.sql puis réessayez.",
      };
    }

    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    userLogger.error("Create document template failed on insert", {
      error: reason,
    });
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de créer le template. Détail: ${reason}`
          : "Impossible de créer le template pour le moment.",
    };
  }

  revalidatePath("/dashboard/document-templates");
  revalidatePath(`/dashboard/document-templates/${templateId}/edit`);
  revalidatePath("/documents");
  revalidatePath("/dashboard/projects/new");
  revalidatePath(`/api/document-templates/${parsed.data.slug}`);

  userLogger.info("Document template created", {
    templateId,
    slug: parsed.data.slug,
    hasAttachment: Boolean(attachedDocumentPath),
  });

  return {
    ok: true,
    message: "Template créé avec succès.",
  };
}

export async function updateDocumentTemplateAction(
  _prevState: DocumentTemplateFormState,
  formData: FormData
): Promise<DocumentTemplateFormState> {
  const actionLogger = await getServerActionLogger("dashboard.document-template.update");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    actionLogger
      .child({ userId: "anonymous" })
      .warn("Update document template rejected: invalid session");
    return {
      ok: false,
      message: "Session invalide. Reconnectez-vous.",
    };
  }
  const userLogger = actionLogger.child({ userId: session.user.id });

  const templateId = getValue(formData, "templateId");
  if (!templateId || !isUuid(templateId)) {
    userLogger.warn("Update document template rejected: invalid template id", {
      templateId,
    });
    return {
      ok: false,
      message: "Template introuvable.",
    };
  }

  const parsed = parseTemplateForm(formData);
  if (!parsed.data) {
    userLogger.warn("Update document template validation failed", {
      templateId,
      fields: Object.keys(parsed.fieldErrors ?? {}),
    });
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const attachmentRaw = formData.get("attachedDocument");
  const attachmentFile =
    attachmentRaw instanceof File && attachmentRaw.size > 0 ? attachmentRaw : null;
  const removeAttachedDocument = formData.get("removeAttachedDocument") === "on";

  if (attachmentFile) {
    if (!isSupportedAttachmentFile(attachmentFile)) {
      userLogger.warn("Update document template rejected: unsupported attachment", {
        templateId,
        fileName: attachmentFile.name,
        mimeType: attachmentFile.type,
      });
      return {
        ok: false,
        message: "Le document joint est invalide.",
        fieldErrors: {
          attachedDocument:
            "Format non supporté (PDF, Word, Excel, PowerPoint, CSV, TXT, JSON).",
        },
      };
    }

    if (attachmentFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
      userLogger.warn("Update document template rejected: attachment too large", {
        templateId,
        fileName: attachmentFile.name,
        sizeBytes: attachmentFile.size,
      });
      return {
        ok: false,
        message: "Le document joint est trop volumineux.",
        fieldErrors: {
          attachedDocument: "Le fichier doit faire moins de 20 MB.",
        },
      };
    }
  }

  let templateRecords: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: CategoryValue;
    level: LevelValue;
    fileType: FileTypeValue;
    objective: ObjectiveValue;
    sectorTags: string[];
    highlight: string;
    attachedDocumentPath: string | null;
    attachedDocumentName: string | null;
    attachedDocumentMimeType: string | null;
    attachedDocumentSizeBytes: number | null;
    isPublished: boolean;
    isFeatured: boolean;
  }> = [];

  try {
    templateRecords = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        category: CategoryValue;
        level: LevelValue;
        fileType: FileTypeValue;
        objective: ObjectiveValue;
        sectorTags: string[];
        highlight: string;
        attachedDocumentPath: string | null;
        attachedDocumentName: string | null;
        attachedDocumentMimeType: string | null;
        attachedDocumentSizeBytes: number | null;
        isPublished: boolean;
        isFeatured: boolean;
      }>
    >`
      SELECT
        "id",
        "title",
        "slug",
        "summary",
        "category",
        "level",
        "fileType",
        "objective",
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
  } catch (error) {
    userLogger.error("Update document template failed while loading record", {
      templateId,
      error,
    });
    if (isDocumentTemplateAttachmentSchemaError(error)) {
      return {
        ok: false,
        message:
          "Le schéma DocumentTemplate est incomplet. Exécutez supabase/document_templates.sql puis réessayez.",
      };
    }
    throw error;
  }

  const template = templateRecords[0];

  if (!template) {
    userLogger.warn("Update document template rejected: template not found", {
      templateId,
    });
    return {
      ok: false,
      message: "Template introuvable ou accès refusé.",
    };
  }

  let uploadedAttachmentObjectKey: string | null = null;
  let nextAttachedDocumentPath = template.attachedDocumentPath;
  let nextAttachedDocumentName = template.attachedDocumentName;
  let nextAttachedDocumentMimeType = template.attachedDocumentMimeType;
  let nextAttachedDocumentSizeBytes = template.attachedDocumentSizeBytes;

  if (removeAttachedDocument && !attachmentFile) {
    nextAttachedDocumentPath = null;
    nextAttachedDocumentName = null;
    nextAttachedDocumentMimeType = null;
    nextAttachedDocumentSizeBytes = null;
  }

  if (attachmentFile) {
    try {
      const attachmentKey = buildTemplateDocumentPath(
        session.user.id,
        template.id,
        attachmentFile
      );
      const uploadResult = await uploadProjectDocumentObject(attachmentFile, attachmentKey);
      uploadedAttachmentObjectKey = uploadResult.objectKey;
      nextAttachedDocumentPath = uploadResult.objectKey;
      nextAttachedDocumentName = attachmentFile.name;
      nextAttachedDocumentMimeType = attachmentFile.type || null;
      nextAttachedDocumentSizeBytes = attachmentFile.size;
    } catch (error) {
      userLogger.error("Update document template attachment upload failed", {
        templateId: template.id,
        error,
      });
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      return {
        ok: false,
        message:
          process.env.NODE_ENV === "development"
            ? `Impossible d'envoyer le document joint. Détail: ${reason}`
            : "Impossible d'envoyer le document joint. Vérifiez la configuration S3/MinIO.",
      };
    }
  }

  const previousAttachmentPath = template.attachedDocumentPath;

  try {
    const sameSlugRecords = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "DocumentTemplate"
      WHERE "slug" = ${parsed.data.slug}
        AND "id" <> ${template.id}::uuid
      LIMIT 1
    `;

    if (sameSlugRecords.length > 0) {
      userLogger.warn("Update document template rejected: slug already exists", {
        templateId: template.id,
        slug: parsed.data.slug,
      });
      return {
        ok: false,
        message: "Impossible d'enregistrer ce slug.",
        fieldErrors: {
          slug: "Ce slug existe déjà. Choisissez-en un autre.",
        },
      };
    }

    await prisma.$executeRaw`
      UPDATE "DocumentTemplate"
      SET
        "title" = ${parsed.data.title},
        "slug" = ${parsed.data.slug},
        "summary" = ${parsed.data.summary},
        "category" = ${parsed.data.category}::"DocumentTemplateCategory",
        "level" = ${parsed.data.level}::"DocumentTemplateLevel",
        "fileType" = ${parsed.data.fileType}::"DocumentTemplateFileType",
        "objective" = ${parsed.data.objective}::"DocumentTemplateObjective",
        "sectorTags" = ${parsed.data.sectorTags},
        "highlight" = ${parsed.data.highlight},
        "attachedDocumentPath" = ${nextAttachedDocumentPath},
        "attachedDocumentName" = ${nextAttachedDocumentName},
        "attachedDocumentMimeType" = ${nextAttachedDocumentMimeType},
        "attachedDocumentSizeBytes" = ${nextAttachedDocumentSizeBytes},
        "isPublished" = ${parsed.data.isPublished},
        "isFeatured" = ${parsed.data.isFeatured},
        "updatedAt" = NOW()
      WHERE "id" = ${template.id}::uuid
    `;
  } catch (error) {
    if (uploadedAttachmentObjectKey) {
      await deleteProjectDocumentObjects([uploadedAttachmentObjectKey]).catch(
        () => undefined
      );
    }

    if (isDocumentTemplateAttachmentSchemaError(error)) {
      userLogger.warn("Update document template rejected: missing schema columns", {
        templateId: template.id,
      });
      return {
        ok: false,
        message:
          "Le schéma DocumentTemplate est incomplet. Exécutez supabase/document_templates.sql puis réessayez.",
      };
    }

    const reason = error instanceof Error ? error.message : "Erreur inconnue.";
    userLogger.error("Update document template failed on update", {
      templateId: template.id,
      error: reason,
    });
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de mettre à jour le template. Détail: ${reason}`
          : "Impossible de mettre à jour le template pour le moment.",
    };
  }

  if (
    previousAttachmentPath &&
    previousAttachmentPath !== nextAttachedDocumentPath &&
    (removeAttachedDocument || uploadedAttachmentObjectKey)
  ) {
    await deleteProjectDocumentObjects([previousAttachmentPath]).catch(() => undefined);
  }

  revalidatePath("/dashboard/document-templates");
  revalidatePath(`/dashboard/document-templates/${template.id}/edit`);
  revalidatePath("/documents");
  revalidatePath("/dashboard/projects/new");
  revalidatePath(`/api/document-templates/${template.slug}`);
  revalidatePath(`/api/document-templates/${parsed.data.slug}`);

  const changes: UpdateFieldChange[] = [];
  appendFieldChange(changes, "title", template.title, parsed.data.title);
  appendFieldChange(changes, "slug", template.slug, parsed.data.slug);
  appendFieldChange(changes, "summary", template.summary, parsed.data.summary);
  appendFieldChange(changes, "category", template.category, parsed.data.category);
  appendFieldChange(changes, "level", template.level, parsed.data.level);
  appendFieldChange(changes, "fileType", template.fileType, parsed.data.fileType);
  appendFieldChange(changes, "objective", template.objective, parsed.data.objective);
  appendFieldChange(changes, "sectorTags", template.sectorTags, parsed.data.sectorTags);
  appendFieldChange(changes, "highlight", template.highlight, parsed.data.highlight);
  appendFieldChange(changes, "attachedDocumentPath", template.attachedDocumentPath, nextAttachedDocumentPath);
  appendFieldChange(changes, "attachedDocumentName", template.attachedDocumentName, nextAttachedDocumentName);
  appendFieldChange(
    changes,
    "attachedDocumentMimeType",
    template.attachedDocumentMimeType,
    nextAttachedDocumentMimeType
  );
  appendFieldChange(
    changes,
    "attachedDocumentSizeBytes",
    template.attachedDocumentSizeBytes,
    nextAttachedDocumentSizeBytes
  );
  appendFieldChange(changes, "isPublished", template.isPublished, parsed.data.isPublished);
  appendFieldChange(changes, "isFeatured", template.isFeatured, parsed.data.isFeatured);

  userLogger.info("Document template updated", {
    templateId: template.id,
    slug: parsed.data.slug,
    removedAttachment: Boolean(
      removeAttachedDocument && previousAttachmentPath && !nextAttachedDocumentPath
    ),
    hasAttachment: Boolean(nextAttachedDocumentPath),
    changes,
  });

  return {
    ok: true,
    message: "Template mis à jour avec succès.",
  };
}
