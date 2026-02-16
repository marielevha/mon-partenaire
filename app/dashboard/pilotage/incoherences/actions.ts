"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import prisma from "@/src/lib/prisma";
import { getServerActionLogger } from "@/src/lib/logging/server-action";
import { addDashboardNotification } from "@/src/lib/notifications/dashboard-notifications";
import { sendProjectInconsistencyNotificationEmail } from "@/src/lib/notifications/email";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type NotifyOwnerSuccess = {
  ok: true;
  message: string;
};

type NotifyOwnerError = {
  ok: false;
  message: string;
};

export type NotifyOwnerState = NotifyOwnerSuccess | NotifyOwnerError | null;

type NotificationRecord = {
  id: string;
  createdAt: string;
  projectId: string;
  projectTitle: string;
  ownerId: string;
  ownerFullName: string | null;
  issues: string[];
  triggeredByUserId: string;
  status: "queued";
};

function getValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function inferProjectIssues(row: {
  invalidNeedsCount: number;
  isPublishedIncomplete: boolean;
  allocatedShare: number;
}) {
  const issues: string[] = [];

  if (row.invalidNeedsCount > 0) {
    issues.push(`${row.invalidNeedsCount} besoin(s) invalide(s)`);
  }
  if (row.isPublishedIncomplete) {
    issues.push("Projet publié incomplet");
  }
  if (row.allocatedShare > 100) {
    issues.push(`Allocation des parts incohérente (${row.allocatedShare}%)`);
  }

  return issues;
}

async function appendOwnerNotification(record: NotificationRecord) {
  const notificationsDir = path.join(process.cwd(), ".data");
  const notificationsFile = path.join(
    notificationsDir,
    "project-owner-notifications.json"
  );

  await fs.mkdir(notificationsDir, { recursive: true });

  let existing: NotificationRecord[] = [];
  try {
    const current = await fs.readFile(notificationsFile, "utf-8");
    const parsed: unknown = JSON.parse(current);
    if (Array.isArray(parsed)) {
      existing = parsed as NotificationRecord[];
    }
  } catch {
    existing = [];
  }

  const next = [record, ...existing].slice(0, 2000);
  await fs.writeFile(notificationsFile, JSON.stringify(next, null, 2), "utf-8");
}

async function appendLegacyOwnerNotification(record: NotificationRecord) {
  await appendOwnerNotification(record);
}

export async function notifyProjectOwnerAction(
  _prevState: NotifyOwnerState,
  formData: FormData
): Promise<NotifyOwnerState> {
  const actionLogger = await getServerActionLogger("dashboard.quality.notify-owner");
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    actionLogger
      .child({ userId: "anonymous" })
      .warn("Notify owner rejected: invalid session");
    return {
      ok: false,
      message: "Session invalide. Veuillez vous reconnecter.",
    };
  }

  const userLogger = actionLogger.child({ userId: session.user.id });
  const projectId = getValue(formData, "projectId");

  if (!projectId) {
    userLogger.warn("Notify owner rejected: missing projectId");
    return {
      ok: false,
      message: "Projet introuvable.",
    };
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      ownerId: string;
      ownerFullName: string | null;
      ownerEmail: string | null;
      invalidNeedsCount: number;
      isPublishedIncomplete: boolean;
      allocatedShare: number;
    }>
  >`
    SELECT
      p.id,
      p.title,
      p."ownerId",
      pr.full_name AS "ownerFullName",
      au.email AS "ownerEmail",
      COALESCE(ns."invalidNeedsCount", 0)::int AS "invalidNeedsCount",
      (
        p.status = 'PUBLISHED'
        AND (
          p."totalCapital" IS NULL
          OR btrim(COALESCE(p.summary, '')) = ''
          OR btrim(COALESCE(p.description, '')) = ''
        )
      ) AS "isPublishedIncomplete",
      (
        COALESCE(p."ownerEquityPercent", 0) + COALESCE(ns."needsEquityPercent", 0)
      )::int AS "allocatedShare"
    FROM "Project" p
    LEFT JOIN (
      SELECT
        n."projectId",
        COUNT(*) FILTER (
          WHERE
            (n.type = 'FINANCIAL' AND n.amount IS NULL)
            OR (n.type = 'SKILL' AND COALESCE(n."requiredCount", 0) < 1)
            OR (n.type = 'MATERIAL' AND (n.description IS NULL OR btrim(n.description) = ''))
            OR (n.type = 'PARTNERSHIP' AND (n.description IS NULL OR btrim(n.description) = ''))
        )::int AS "invalidNeedsCount",
        COALESCE(SUM(COALESCE(n."equityShare", 0)), 0)::int AS "needsEquityPercent"
      FROM "ProjectNeed" n
      GROUP BY n."projectId"
    ) ns ON ns."projectId" = p.id
    LEFT JOIN public.profiles pr ON pr.id::text = p."ownerId"
    LEFT JOIN auth.users au ON au.id::text = p."ownerId"
    WHERE p.id = ${projectId}
    LIMIT 1
  `;

  const project = rows[0];
  if (!project) {
    userLogger.warn("Notify owner rejected: project not found", { projectId });
    return {
      ok: false,
      message: "Projet introuvable.",
    };
  }

  const issues = inferProjectIssues(project);
  if (issues.length === 0) {
    userLogger.warn("Notify owner skipped: no inconsistency found", { projectId });
    return {
      ok: false,
      message: "Ce projet ne contient plus d'incohérences à notifier.",
    };
  }

  const notification: NotificationRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    projectId: project.id,
    projectTitle: project.title,
    ownerId: project.ownerId,
    ownerFullName: project.ownerFullName,
    issues,
    triggeredByUserId: session.user.id,
    status: "queued",
  };

  try {
    let emailStatus:
      | {
          sent: boolean;
          skipped: boolean;
          reason?: string;
          provider?: string;
          providerMessageId?: string | null;
        }
      | {
          sent: false;
          skipped: true;
          reason: string;
        } = {
      sent: false,
      skipped: true,
      reason: "Email destinataire indisponible",
    };

    if (project.ownerEmail) {
      emailStatus = await sendProjectInconsistencyNotificationEmail({
        to: project.ownerEmail,
        recipientName: project.ownerFullName,
        projectId: project.id,
        projectTitle: project.title,
        issues,
        triggeredByUserId: session.user.id,
      });
    }

    await addDashboardNotification({
      userId: project.ownerId,
      title: "Projet à corriger",
      message: `Le projet "${project.title}" contient des incohérences: ${issues.join(", ")}.`,
      type: "project_inconsistency",
      projectId: project.id,
      metadata: {
        issues,
        email: emailStatus,
      },
      triggeredByUserId: session.user.id,
    });
    await appendLegacyOwnerNotification(notification);

    if (emailStatus.sent) {
      userLogger.info("Owner email notification sent", {
        projectId: project.id,
        ownerId: project.ownerId,
        provider: emailStatus.provider,
        providerMessageId: emailStatus.providerMessageId ?? null,
      });
    } else {
      userLogger.warn("Owner email notification skipped/failed", {
        projectId: project.id,
        ownerId: project.ownerId,
        reason: emailStatus.reason ?? "unknown",
        skipped: emailStatus.skipped,
      });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    userLogger.error("Failed to queue owner notification", {
      projectId: project.id,
      ownerId: project.ownerId,
      reason,
    });
    return {
      ok: false,
      message: "Impossible d'enregistrer la notification pour le moment.",
    };
  }

  userLogger.info("Owner notification queued", {
    projectId: project.id,
    ownerId: project.ownerId,
    notificationId: notification.id,
    issues,
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/pilotage/incoherences");

  return {
    ok: true,
    message:
      project.ownerEmail
        ? "Notification interne enregistrée. Tentative d'envoi email effectuée."
        : "Notification interne enregistrée (email propriétaire indisponible).",
  };
}
