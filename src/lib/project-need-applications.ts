import { Prisma } from "@prisma/client";
import prisma from "@/src/lib/prisma";

export const PROJECT_NEED_APPLICATION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ProjectNeedApplicationStatus =
  (typeof PROJECT_NEED_APPLICATION_STATUSES)[number];

export type NeedApplicationOwnerListItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  needId: string;
  needTitle: string;
  needType: string;
  applicantUserId: string;
  applicantEmail: string | null;
  applicantFullName: string | null;
  ownerUserId: string;
  message: string | null;
  proposedAmount: number | null;
  proposedRequiredCount: number | null;
  proposedEquityPercent: number | null;
  proposedSkillTags: string[];
  status: ProjectNeedApplicationStatus;
  decisionNote: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export function isMissingProjectNeedApplicationsSchemaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return true;
    }
    if (error.code === "P2010") {
      const metaCode =
        typeof error.meta?.code === "string" ? error.meta.code : undefined;
      return metaCode === "42P01";
    }
    return false;
  }

  const reason = error instanceof Error ? error.message : String(error);
  return /42P01|relation .* does not exist|table .* does not exist/i.test(reason);
}

export async function getLatestNeedApplicationStatusesForUser(
  projectId: string,
  userId: string
): Promise<Record<string, ProjectNeedApplicationStatus>> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ projectNeedId: string; status: ProjectNeedApplicationStatus }>
    >`
      SELECT DISTINCT ON ("projectNeedId")
        "projectNeedId"::text AS "projectNeedId",
        "status"
      FROM public."ProjectNeedApplication"
      WHERE "projectId" = ${projectId}
        AND "applicantUserId" = ${userId}
      ORDER BY "projectNeedId", "createdAt" DESC
    `;

    return rows.reduce<Record<string, ProjectNeedApplicationStatus>>(
      (accumulator, row) => {
        accumulator[row.projectNeedId] = row.status;
        return accumulator;
      },
      {}
    );
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return {};
    }
    throw error;
  }
}

export async function listNeedApplicationsForOwner(
  ownerUserId: string | null,
  options?: {
    status?: ProjectNeedApplicationStatus | "ALL";
    limit?: number;
  }
): Promise<NeedApplicationOwnerListItem[]> {
  const status = options?.status ?? "ALL";
  const limit = Math.max(1, Math.min(options?.limit ?? 500, 2000));

  const ownerSql = ownerUserId
    ? Prisma.sql`AND app."ownerUserId" = ${ownerUserId}`
    : Prisma.empty;
  const statusSql =
    status === "ALL"
      ? Prisma.empty
      : Prisma.sql`AND app."status" = ${status}::public."ProjectNeedApplicationStatus"`;

  try {
    return await prisma.$queryRaw<NeedApplicationOwnerListItem[]>`
      SELECT
        app."id"::text AS "id",
        app."projectId"::text AS "projectId",
        p."title" AS "projectTitle",
        p."status"::text AS "projectStatus",
        app."projectNeedId"::text AS "needId",
        n."title" AS "needTitle",
        app."needType" AS "needType",
        app."applicantUserId"::text AS "applicantUserId",
        au."email"::text AS "applicantEmail",
        prof."full_name" AS "applicantFullName",
        app."ownerUserId"::text AS "ownerUserId",
        app."message" AS "message",
        app."proposedAmount" AS "proposedAmount",
        app."proposedRequiredCount" AS "proposedRequiredCount",
        app."proposedEquityPercent" AS "proposedEquityPercent",
        app."proposedSkillTags" AS "proposedSkillTags",
        app."status" AS "status",
        app."decisionNote" AS "decisionNote",
        app."decidedAt" AS "decidedAt",
        app."createdAt" AS "createdAt"
      FROM public."ProjectNeedApplication" app
      JOIN public."Project" p ON p."id" = app."projectId"
      JOIN public."ProjectNeed" n ON n."id" = app."projectNeedId"
      LEFT JOIN auth.users au ON au."id"::text = app."applicantUserId"
      LEFT JOIN public.profiles prof ON prof."id"::text = app."applicantUserId"
      WHERE 1 = 1
      ${ownerSql}
      ${statusSql}
      ORDER BY app."createdAt" DESC
      LIMIT ${limit}
    `;
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return [];
    }
    throw error;
  }
}

export async function listNeedApplicationsForUser(
  userId: string,
  options?: {
    status?: ProjectNeedApplicationStatus | "ALL";
    limit?: number;
  }
): Promise<NeedApplicationOwnerListItem[]> {
  const status = options?.status ?? "ALL";
  const limit = Math.max(1, Math.min(options?.limit ?? 500, 2000));
  const statusSql =
    status === "ALL"
      ? Prisma.empty
      : Prisma.sql`AND app."status" = ${status}::public."ProjectNeedApplicationStatus"`;

  try {
    return await prisma.$queryRaw<NeedApplicationOwnerListItem[]>`
      SELECT
        app."id"::text AS "id",
        app."projectId"::text AS "projectId",
        p."title" AS "projectTitle",
        p."status"::text AS "projectStatus",
        app."projectNeedId"::text AS "needId",
        n."title" AS "needTitle",
        app."needType" AS "needType",
        app."applicantUserId"::text AS "applicantUserId",
        au."email"::text AS "applicantEmail",
        prof."full_name" AS "applicantFullName",
        app."ownerUserId"::text AS "ownerUserId",
        app."message" AS "message",
        app."proposedAmount" AS "proposedAmount",
        app."proposedRequiredCount" AS "proposedRequiredCount",
        app."proposedEquityPercent" AS "proposedEquityPercent",
        app."proposedSkillTags" AS "proposedSkillTags",
        app."status" AS "status",
        app."decisionNote" AS "decisionNote",
        app."decidedAt" AS "decidedAt",
        app."createdAt" AS "createdAt"
      FROM public."ProjectNeedApplication" app
      JOIN public."Project" p ON p."id" = app."projectId"
      JOIN public."ProjectNeed" n ON n."id" = app."projectNeedId"
      LEFT JOIN auth.users au ON au."id"::text = app."applicantUserId"
      LEFT JOIN public.profiles prof ON prof."id"::text = app."applicantUserId"
      WHERE (app."ownerUserId" = ${userId} OR app."applicantUserId" = ${userId})
      ${statusSql}
      ORDER BY app."createdAt" DESC
      LIMIT ${limit}
    `;
  } catch (error) {
    if (isMissingProjectNeedApplicationsSchemaError(error)) {
      return [];
    }
    throw error;
  }
}
