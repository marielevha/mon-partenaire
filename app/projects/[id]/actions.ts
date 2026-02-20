"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import { addDashboardNotification } from "@/src/lib/notifications/dashboard-notifications";
import { sendNeedApplicationCreatedEmail } from "@/src/lib/notifications/email";
import { splitSkillTags } from "@/src/lib/project-needs";
import { isMissingProjectNeedApplicationsSchemaError } from "@/src/lib/project-need-applications";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type NeedApplicationField =
  | "projectNeedId"
  | "proposedAmount"
  | "proposedRequiredCount"
  | "proposedEquityPercent"
  | "proposedSkillTags"
  | "message";

export type NeedApplicationState =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<NeedApplicationField, string>>;
    }
  | null;

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalInteger(value: string) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function mapSchemaMissingError(): NeedApplicationState {
  return {
    ok: false,
    message:
      'Le système de candidatures n\'est pas encore initialisé. Exécutez `supabase/project_need_applications.sql` (et `supabase/project_needs_upgrade.sql` si nécessaire), puis réessayez.',
  };
}

function buildApplicationValidation(
  needType: string,
  formData: FormData
): {
  fieldErrors?: Partial<Record<NeedApplicationField, string>>;
  payload?: {
    message: string | null;
    proposedAmount: number | null;
    proposedRequiredCount: number | null;
    proposedEquityPercent: number | null;
    proposedSkillTags: string[];
  };
} {
  const fieldErrors: Partial<Record<NeedApplicationField, string>> = {};

  const messageRaw = getValue(formData, "message");
  const proposedAmount = parseOptionalInteger(getValue(formData, "proposedAmount"));
  const proposedRequiredCount = parseOptionalInteger(
    getValue(formData, "proposedRequiredCount")
  );
  const proposedEquityPercent = parseOptionalInteger(
    getValue(formData, "proposedEquityPercent")
  );
  const proposedSkillTags = splitSkillTags(getValue(formData, "proposedSkillTags"));

  if (Number.isNaN(proposedAmount as number)) {
    fieldErrors.proposedAmount = "Montant invalide.";
  }
  if (Number.isNaN(proposedRequiredCount as number)) {
    fieldErrors.proposedRequiredCount = "Quantité invalide.";
  }
  if (Number.isNaN(proposedEquityPercent as number)) {
    fieldErrors.proposedEquityPercent = "Pourcentage invalide.";
  }
  if (
    typeof proposedEquityPercent === "number" &&
    (proposedEquityPercent < 0 || proposedEquityPercent > 100)
  ) {
    fieldErrors.proposedEquityPercent = "Le pourcentage doit être entre 0 et 100.";
  }

  if (needType === "FINANCIAL") {
    if (typeof proposedAmount !== "number" || proposedAmount <= 0) {
      fieldErrors.proposedAmount = "Le montant proposé est obligatoire.";
    }

    if (
      proposedRequiredCount !== null &&
      (typeof proposedRequiredCount !== "number" || proposedRequiredCount < 1)
    ) {
      fieldErrors.proposedRequiredCount = "La quantité doit être supérieure ou égale à 1.";
    }
  }

  if (needType === "SKILL") {
    if (typeof proposedRequiredCount !== "number" || proposedRequiredCount < 1) {
      fieldErrors.proposedRequiredCount = "Le nombre de profils est obligatoire.";
    }
  }

  if (needType === "MATERIAL" || needType === "PARTNERSHIP") {
    if (messageRaw.length < 10) {
      fieldErrors.message = "Décrivez votre proposition (minimum 10 caractères).";
    }
  }

  if (messageRaw.length > 2500) {
    fieldErrors.message = "Message trop long (2500 caractères max).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    payload: {
      message: messageRaw || null,
      proposedAmount: needType === "FINANCIAL" ? proposedAmount : null,
      proposedRequiredCount:
        needType === "FINANCIAL"
          ? proposedRequiredCount ?? 1
          : needType === "SKILL"
            ? proposedRequiredCount
            : null,
      proposedEquityPercent:
        needType === "FINANCIAL" || needType === "SKILL" ? proposedEquityPercent : null,
      proposedSkillTags: needType === "SKILL" ? proposedSkillTags : [],
    },
  };
}

export async function submitNeedApplicationAction(
  _prevState: NeedApplicationState,
  formData: FormData
): Promise<NeedApplicationState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Connectez-vous pour candidater à ce besoin.",
    };
  }

  const projectId = getValue(formData, "projectId");
  const projectNeedId = getValue(formData, "projectNeedId");
  const needTypeInput = getValue(formData, "needType").toUpperCase();

  if (!projectId || !projectNeedId) {
    return {
      ok: false,
      message: "Référence projet/besoin invalide.",
      fieldErrors: {
        projectNeedId: "Besoin invalide.",
      },
    };
  }

  const validation = buildApplicationValidation(needTypeInput, formData);
  if (!validation.payload) {
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const needRows = await prisma.$queryRaw<
    Array<{
      projectId: string;
      projectTitle: string;
      projectStatus: string;
      projectVisibility: string;
      ownerUserId: string;
      needId: string;
      needType: string;
      needTitle: string;
      isFilled: boolean;
    }>
  >`
    SELECT
      p."id"::text AS "projectId",
      p."title" AS "projectTitle",
      p."status"::text AS "projectStatus",
      p."visibility"::text AS "projectVisibility",
      p."ownerId"::text AS "ownerUserId",
      n."id"::text AS "needId",
      n."type" AS "needType",
      n."title" AS "needTitle",
      n."isFilled" AS "isFilled"
    FROM public."Project" p
    JOIN public."ProjectNeed" n ON n."projectId" = p."id"
    WHERE p."id" = ${projectId}
      AND n."id" = ${projectNeedId}
    LIMIT 1
  `;

  const needRecord = needRows[0];
  if (!needRecord) {
    return {
      ok: false,
      message: "Besoin introuvable.",
      fieldErrors: {
        projectNeedId: "Ce besoin n'existe plus.",
      },
    };
  }

  if (needRecord.needType !== needTypeInput) {
    return {
      ok: false,
      message: "Type de besoin incohérent.",
    };
  }

  if (session.user.id === needRecord.ownerUserId) {
    return {
      ok: false,
      message: "Vous ne pouvez pas candidater à votre propre projet.",
    };
  }

  if (needRecord.projectStatus !== "PUBLISHED" || needRecord.projectVisibility !== "PUBLIC") {
    return {
      ok: false,
      message: "Ce projet n'accepte pas de candidatures actuellement.",
    };
  }

  if (needRecord.isFilled) {
    return {
      ok: false,
      message: "Ce besoin est déjà comblé.",
    };
  }

  try {
    const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"::text AS "id"
      FROM public."ProjectNeedApplication"
      WHERE "projectNeedId" = ${projectNeedId}
        AND "applicantUserId" = ${session.user.id}
        AND "status" = 'PENDING'::public."ProjectNeedApplicationStatus"
      LIMIT 1
    `;

    if (duplicateRows.length > 0) {
      return {
        ok: false,
        message: "Vous avez déjà une candidature en attente sur ce besoin.",
      };
    }

    await prisma.$executeRaw`
      INSERT INTO public."ProjectNeedApplication"
        (
          "id",
          "projectId",
          "projectNeedId",
          "applicantUserId",
          "ownerUserId",
          "needType",
          "message",
          "proposedAmount",
          "proposedRequiredCount",
          "proposedEquityPercent",
          "proposedSkillTags",
          "status",
          "createdAt",
          "updatedAt"
        )
      VALUES
        (
          ${crypto.randomUUID()},
          ${projectId},
          ${projectNeedId},
          ${session.user.id},
          ${needRecord.ownerUserId},
          ${needRecord.needType},
          ${validation.payload.message},
          ${validation.payload.proposedAmount},
          ${validation.payload.proposedRequiredCount},
          ${validation.payload.proposedEquityPercent},
          ${validation.payload.proposedSkillTags},
          'PENDING'::public."ProjectNeedApplicationStatus",
          NOW(),
          NOW()
        )
    `;
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return mapSchemaMissingError();
    }
    throw error;
  }

  const actorRows = await prisma.$queryRaw<
    Array<{ email: string | null; fullName: string | null }>
  >`
    SELECT
      u."email"::text AS "email",
      pr."full_name" AS "fullName"
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr."id" = u."id"
    WHERE u."id"::text = ${session.user.id}
    LIMIT 1
  `;
  const ownerRows = await prisma.$queryRaw<
    Array<{ email: string | null; fullName: string | null }>
  >`
    SELECT
      u."email"::text AS "email",
      pr."full_name" AS "fullName"
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr."id" = u."id"
    WHERE u."id"::text = ${needRecord.ownerUserId}
    LIMIT 1
  `;

  const actorIdentity =
    actorRows[0]?.fullName?.trim() || actorRows[0]?.email?.trim() || "Un utilisateur";

  await addDashboardNotification({
    userId: needRecord.ownerUserId,
    title: "Nouvelle candidature",
    message: `${actorIdentity} a candidaté au besoin "${needRecord.needTitle}" sur le projet "${needRecord.projectTitle}".`,
    type: "project_need_application",
    projectId,
    metadata: {
      projectNeedId,
      needType: needRecord.needType,
      applicantUserId: session.user.id,
    },
    triggeredByUserId: session.user.id,
  }).catch(() => undefined);

  if (ownerRows[0]?.email) {
    await sendNeedApplicationCreatedEmail({
      to: ownerRows[0].email,
      recipientName: ownerRows[0].fullName,
      projectId,
      projectTitle: needRecord.projectTitle,
      needTitle: needRecord.needTitle,
      needType: needRecord.needType,
      applicantName: actorRows[0]?.fullName,
      applicantEmail: actorRows[0]?.email,
      message: validation.payload.message,
      triggeredByUserId: session.user.id,
    }).catch(() => undefined);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects/applications");
  revalidatePath("/dashboard/notifications");

  return {
    ok: true,
    message: "Candidature envoyée avec succès.",
  };
}
