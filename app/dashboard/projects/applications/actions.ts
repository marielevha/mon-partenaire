"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import { addDashboardNotification } from "@/src/lib/notifications/dashboard-notifications";
import { sendNeedApplicationDecisionEmail } from "@/src/lib/notifications/email";
import { isMissingProjectNeedApplicationsSchemaError } from "@/src/lib/project-need-applications";
import { RBAC_PERMISSIONS } from "@/src/lib/rbac/permissions";
import { userHasPermission } from "@/src/lib/rbac/core";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type ReviewNeedApplicationState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | null;

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDecision(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "ACCEPT") return "ACCEPT";
  if (normalized === "REJECT") return "REJECT";
  return null;
}

function isMissingRequiredCountColumnError(error: unknown) {
  const reason = error instanceof Error ? error.message : String(error);
  return /42703|requiredCount|column .* does not exist/i.test(reason);
}

export async function reviewNeedApplicationAction(
  _prevState: ReviewNeedApplicationState,
  formData: FormData
): Promise<ReviewNeedApplicationState> {
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

  const applicationId = getValue(formData, "applicationId");
  const decision = parseDecision(getValue(formData, "decision"));
  const decisionNote = getValue(formData, "decisionNote");

  if (!applicationId || !decision) {
    return {
      ok: false,
      message: "Demande invalide.",
    };
  }

  if (decisionNote.length > 1200) {
    return {
      ok: false,
      message: "La note de décision est trop longue (1200 caractères max).",
    };
  }

  const [canUpdateOwn, canUpdateAny] = await Promise.all([
    userHasPermission(session.user.id, RBAC_PERMISSIONS.DASHBOARD_PROJECTS_UPDATE_OWN),
    userHasPermission(session.user.id, RBAC_PERMISSIONS.DASHBOARD_PROJECTS_UPDATE_ANY),
  ]);

  if (!canUpdateOwn && !canUpdateAny) {
    return {
      ok: false,
      message: "Accès refusé.",
    };
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      projectId: string;
      projectTitle: string;
      projectStatus: string;
      projectNeedId: string;
      needTitle: string;
      needType: string;
      ownerUserId: string;
      applicantUserId: string;
      status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
    }>
  >`
    SELECT
      app."id"::text AS "id",
      app."projectId"::text AS "projectId",
      p."title" AS "projectTitle",
      p."status"::text AS "projectStatus",
      app."projectNeedId"::text AS "projectNeedId",
      n."title" AS "needTitle",
      app."needType" AS "needType",
      app."ownerUserId"::text AS "ownerUserId",
      app."applicantUserId"::text AS "applicantUserId",
      app."status"::text AS "status"
    FROM public."ProjectNeedApplication" app
    JOIN public."Project" p ON p."id" = app."projectId"
    JOIN public."ProjectNeed" n ON n."id" = app."projectNeedId"
    WHERE app."id" = ${applicationId}
    LIMIT 1
  `.catch((error) => {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return [];
    }
    throw error;
  });

  const application = rows[0];
  if (!application) {
    return {
      ok: false,
      message:
        'Système de candidatures indisponible ou candidature introuvable. Vérifiez `supabase/project_need_applications.sql` et `supabase/project_needs_upgrade.sql`.',
    };
  }

  if (!canUpdateAny && application.ownerUserId !== session.user.id) {
    return {
      ok: false,
      message: "Accès refusé sur cette candidature.",
    };
  }

  if (application.status !== "PENDING") {
    return {
      ok: false,
      message: "Cette candidature n'est plus en attente.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const targetStatus = decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

      await tx.$executeRaw`
        UPDATE public."ProjectNeedApplication"
        SET
          "status" = ${targetStatus}::public."ProjectNeedApplicationStatus",
          "decisionNote" = ${decisionNote || null},
          "decidedByUserId" = ${session.user.id},
          "decidedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${application.id}
          AND "status" = 'PENDING'::public."ProjectNeedApplicationStatus"
      `;

      if (decision === "ACCEPT") {
        await tx.$executeRaw`
          INSERT INTO public."ProjectMember"
            (
              "id",
              "projectId",
              "userId",
              "applicationId",
              "engagementType",
              "status",
              "createdAt",
              "updatedAt"
            )
          VALUES
            (
              ${crypto.randomUUID()},
              ${application.projectId},
              ${application.applicantUserId},
              ${application.id},
              ${application.needType},
              'ACTIVE'::public."ProjectMemberStatus",
              NOW(),
              NOW()
            )
          ON CONFLICT ("projectId", "userId")
          DO UPDATE SET
            "applicationId" = EXCLUDED."applicationId",
            "engagementType" = EXCLUDED."engagementType",
            "status" = 'ACTIVE'::public."ProjectMemberStatus",
            "updatedAt" = NOW()
        `;

        let needProgressRows: Array<{
          amount: number | null;
          requiredCount: number | null;
          acceptedAmount: number;
          acceptedCount: number;
        }> = [];
        try {
          needProgressRows = await tx.$queryRaw<
            Array<{
              amount: number | null;
              requiredCount: number | null;
              acceptedAmount: number;
              acceptedCount: number;
            }>
          >`
            SELECT
              n."amount" AS "amount",
              n."requiredCount" AS "requiredCount",
              COALESCE(SUM(CASE WHEN a."status" = 'ACCEPTED'::public."ProjectNeedApplicationStatus" THEN COALESCE(a."proposedAmount", 0) ELSE 0 END), 0)::int AS "acceptedAmount",
              COALESCE(SUM(CASE WHEN a."status" = 'ACCEPTED'::public."ProjectNeedApplicationStatus" THEN 1 ELSE 0 END), 0)::int AS "acceptedCount"
            FROM public."ProjectNeed" n
            LEFT JOIN public."ProjectNeedApplication" a ON a."projectNeedId" = n."id"
            WHERE n."id" = ${application.projectNeedId}
            GROUP BY n."id"
          `;
        } catch (error) {
          if (!isMissingRequiredCountColumnError(error)) {
            throw error;
          }

          needProgressRows = await tx.$queryRaw<
            Array<{
              amount: number | null;
              requiredCount: number | null;
              acceptedAmount: number;
              acceptedCount: number;
            }>
          >`
            SELECT
              n."amount" AS "amount",
              NULL::int AS "requiredCount",
              COALESCE(SUM(CASE WHEN a."status" = 'ACCEPTED'::public."ProjectNeedApplicationStatus" THEN COALESCE(a."proposedAmount", 0) ELSE 0 END), 0)::int AS "acceptedAmount",
              COALESCE(SUM(CASE WHEN a."status" = 'ACCEPTED'::public."ProjectNeedApplicationStatus" THEN 1 ELSE 0 END), 0)::int AS "acceptedCount"
            FROM public."ProjectNeed" n
            LEFT JOIN public."ProjectNeedApplication" a ON a."projectNeedId" = n."id"
            WHERE n."id" = ${application.projectNeedId}
            GROUP BY n."id"
          `;
        }
        const needProgress = needProgressRows[0];

        let shouldFillNeed = true;
        if (application.needType === "FINANCIAL") {
          const targetAmount = needProgress?.amount ?? null;
          shouldFillNeed =
            typeof targetAmount === "number" && targetAmount > 0
              ? (needProgress?.acceptedAmount ?? 0) >= targetAmount
              : (needProgress?.acceptedAmount ?? 0) > 0;
        } else if (application.needType === "SKILL") {
          const requiredCount = needProgress?.requiredCount ?? null;
          shouldFillNeed =
            typeof requiredCount === "number" && requiredCount > 0
              ? (needProgress?.acceptedCount ?? 0) >= requiredCount
              : (needProgress?.acceptedCount ?? 0) > 0;
        } else {
          shouldFillNeed = true;
        }

        if (shouldFillNeed) {
          await tx.$executeRaw`
            UPDATE public."ProjectNeed"
            SET "isFilled" = true
            WHERE "id" = ${application.projectNeedId}
          `;
        }

        const closureRows = await tx.$queryRaw<
          Array<{
            ownerEquityPercent: number | null;
            needsEquityPercent: number;
            openNeeds: number;
          }>
        >`
          SELECT
            p."ownerEquityPercent" AS "ownerEquityPercent",
            COALESCE(SUM(COALESCE(n."equityShare", 0)), 0)::int AS "needsEquityPercent",
            COALESCE(SUM(CASE WHEN n."isFilled" THEN 0 ELSE 1 END), 0)::int AS "openNeeds"
          FROM public."Project" p
          LEFT JOIN public."ProjectNeed" n ON n."projectId" = p."id"
          WHERE p."id" = ${application.projectId}
          GROUP BY p."id"
        `;

        const closure = closureRows[0];
        if (closure) {
          const totalAllocated =
            (closure.ownerEquityPercent ?? 0) + (closure.needsEquityPercent ?? 0);
          if (closure.openNeeds === 0 && totalAllocated === 100) {
            await tx.$executeRaw`
              UPDATE public."Project"
              SET "status" = 'ARCHIVED'::public."ProjectStatus"
              WHERE "id" = ${application.projectId}
                AND "status" <> 'ARCHIVED'::public."ProjectStatus"
            `;
          }
        }
      }
    });
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return {
        ok: false,
        message:
          'Système de candidatures non initialisé. Exécutez `supabase/project_need_applications.sql` (et `supabase/project_needs_upgrade.sql` si nécessaire).',
      };
    }
    const reason = error instanceof Error ? error.message : "Erreur inconnue";
    return {
      ok: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Impossible de traiter la candidature. Détail: ${reason}`
          : "Impossible de traiter la candidature pour le moment.",
    };
  }

  const applicantRows = await prisma.$queryRaw<
    Array<{ email: string | null; fullName: string | null }>
  >`
    SELECT
      u."email"::text AS "email",
      pr."full_name" AS "fullName"
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr."id" = u."id"
    WHERE u."id"::text = ${application.applicantUserId}
    LIMIT 1
  `;

  const decisionLabel = decision === "ACCEPT" ? "acceptée" : "refusée";
  await addDashboardNotification({
    userId: application.applicantUserId,
    title: `Candidature ${decisionLabel}`,
    message: `Votre candidature au besoin "${application.needTitle}" sur le projet "${application.projectTitle}" a été ${decisionLabel}.`,
    type: "project_need_application_decision",
    projectId: application.projectId,
    metadata: {
      applicationId: application.id,
      needType: application.needType,
      decision: decision === "ACCEPT" ? "ACCEPTED" : "REJECTED",
    },
    triggeredByUserId: session.user.id,
  }).catch(() => undefined);

  if (applicantRows[0]?.email) {
    await sendNeedApplicationDecisionEmail({
      to: applicantRows[0].email,
      recipientName: applicantRows[0].fullName,
      projectId: application.projectId,
      projectTitle: application.projectTitle,
      needTitle: application.needTitle,
      decision: decision === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      decisionNote,
      triggeredByUserId: session.user.id,
    }).catch(() => undefined);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/projects/applications");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/dashboard/projects/${application.projectId}/edit`);
  revalidatePath(`/projects/${application.projectId}`);
  revalidatePath("/projects");

  return {
    ok: true,
    message:
      decision === "ACCEPT"
        ? "Candidature acceptée avec succès."
        : "Candidature refusée avec succès.",
  };
}
