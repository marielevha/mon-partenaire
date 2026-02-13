import { Prisma } from "@prisma/client";
import type {
  EquityModel,
  LegalForm,
  ProjectCategory,
  ProjectVisibility,
} from "@prisma/client";
import prisma from "@/src/lib/prisma";
import {
  resolveS3DocumentPublicUrlFromStoredValue,
  resolveS3PublicUrlFromStoredValue,
} from "@/src/lib/s3-storage";

const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  "AGRIBUSINESS",
  "TECH",
  "HEALTH",
  "EDUCATION",
  "INFRASTRUCTURE",
  "OTHER",
];

export type ProjectListItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  totalCapital?: number | null;
  remainingNeeds: number;
  needTypes: string[];
  coverImageUrl: string | null;
  equityAllocationPercent: number;
};

export type ProjectNeedRecord = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  amount: number | null;
  requiredCount: number | null;
  equityPercent: number | null;
  skillTags: string[];
  isFilled: boolean;
  createdAt: Date;
};

type ProjectListRecord = {
  id: string;
  title: string;
  summary: string;
  category: ProjectCategory;
  city: string;
  totalCapital: number | null;
  needs: Array<{
    type: string;
    isFilled: boolean;
    equityShare: number | null;
  }>;
  images: Array<{
    storagePath: string;
  }>;
};

export type CreateProjectDraftInput = {
  ownerId: string;
  title: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  city: string;
  country: string;
  legalForm: LegalForm | null;
  companyCreated: boolean;
  totalCapital: number | null;
  ownerContribution: number | null;
  ownerEquityPercent: number | null;
  equityModel: EquityModel;
  equityNote: string | null;
  visibility: ProjectVisibility;
};

export async function createProjectDraft(input: CreateProjectDraftInput) {
  const project = await prisma.project.create({
    data: {
      ownerId: input.ownerId,
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
      status: "DRAFT",
    },
    select: {
      id: true,
    },
  });

  await prisma.$executeRaw`
    UPDATE "Project"
    SET "ownerEquityPercent" = ${input.ownerEquityPercent}
    WHERE "id" = ${project.id}
  `;

  return project;
}

export function buildProjectImagePublicUrl(storagePath: string): string | null {
  return resolveS3PublicUrlFromStoredValue(storagePath);
}

export function buildProjectDocumentPublicUrl(storagePath: string): string | null {
  return resolveS3DocumentPublicUrlFromStoredValue(storagePath);
}

function isMissingRequiredCountColumnError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2010" || error.code === "P2021";
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("42703") ||
    message.includes('column "requiredCount"') ||
    message.includes("ProjectNeed")
  );
}

export async function getProjectNeedsByProjectId(
  projectId: string
): Promise<ProjectNeedRecord[]> {
  try {
    return await prisma.$queryRaw<ProjectNeedRecord[]>`
      SELECT
        "id",
        "type",
        "title",
        "description",
        "amount",
        "requiredCount",
        "equityShare" AS "equityPercent",
        "skillTags",
        "isFilled",
        "createdAt"
      FROM "ProjectNeed"
      WHERE "projectId" = ${projectId}
      ORDER BY "isFilled" ASC, "createdAt" ASC
    `;
  } catch (error) {
    if (!isMissingRequiredCountColumnError(error)) {
      throw error;
    }

    const fallbackRows = await prisma.$queryRaw<
      Array<
        Omit<ProjectNeedRecord, "requiredCount" | "equityPercent"> & {
          equityPercent: number | null;
        }
      >
    >`
      SELECT
        "id",
        "type",
        "title",
        "description",
        "amount",
        "equityShare" AS "equityPercent",
        "skillTags",
        "isFilled",
        "createdAt"
      FROM "ProjectNeed"
      WHERE "projectId" = ${projectId}
      ORDER BY "isFilled" ASC, "createdAt" ASC
    `;

    return fallbackRows.map((row) => ({
      ...row,
      requiredCount: null,
    }));
  }
}

async function getOwnerEquityPercentByProjectIds(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, number>();
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; ownerEquityPercent: number | null }>
    >`
      SELECT
        "id",
        "ownerEquityPercent"
      FROM "Project"
      WHERE "id" IN (${Prisma.join(projectIds)})
    `;

    return new Map(
      rows.map((row) => [row.id, Math.max(0, Math.min(100, row.ownerEquityPercent ?? 0))])
    );
  } catch {
    return new Map<string, number>();
  }
}

function mapProjectRecordToListItem(
  project: ProjectListRecord,
  ownerEquityPercentByProjectId: Map<string, number>
): ProjectListItem {
  const remainingNeeds = project.needs.filter((need) => !need.isFilled).length;
  const needTypes = Array.from(
    new Set(project.needs.filter((need) => !need.isFilled).map((need) => need.type))
  );
  const needsEquityPercent = project.needs.reduce(
    (sum, need) => sum + (need.equityShare ?? 0),
    0
  );
  const ownerEquityPercent = ownerEquityPercentByProjectId.get(project.id) ?? 0;
  const equityAllocationPercent = Math.max(
    0,
    Math.min(100, ownerEquityPercent + needsEquityPercent)
  );
  const publicImages = project.images
    .map((image) => buildProjectImagePublicUrl(image.storagePath))
    .filter((url): url is string => Boolean(url));

  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    category: project.category,
    city: project.city,
    totalCapital: project.totalCapital,
    remainingNeeds,
    needTypes,
    coverImageUrl: publicImages[0] ?? null,
    equityAllocationPercent,
  };
}

export async function getPublicProjectsList(filters?: {
  category?: string | null;
  needType?: string | null;
  city?: string | null;
}): Promise<ProjectListItem[]> {
  const where: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
  };

  if (
    filters?.category &&
    PROJECT_CATEGORIES.includes(filters.category as ProjectCategory)
  ) {
    where.category = filters.category as ProjectCategory;
  }
  if (filters?.city) where.city = { contains: filters.city, mode: "insensitive" };

  // Fetch projects with needs (only select needed fields)
  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      city: true,
      totalCapital: true,
      needs: {
        select: {
          type: true,
          isFilled: true,
          equityShare: true,
        },
      },
      images: {
        select: {
          storagePath: true,
        },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // If needType filter, filter out projects without that need type
  const filtered = projects.filter((p) => {
    if (!filters?.needType) return true;
    return p.needs.some((n) => n.type === filters.needType && !n.isFilled);
  });
  const ownerEquityPercentByProjectId = await getOwnerEquityPercentByProjectIds(
    filtered.map((project) => project.id)
  );

  return filtered.map((project) =>
    mapProjectRecordToListItem(project, ownerEquityPercentByProjectId)
  );
}

export async function getHomeProjectExamples(limit = 3): Promise<ProjectListItem[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 12) : 3;
  const baseWhere: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
  };
  const baseSelect = {
    id: true,
    title: true,
    summary: true,
    category: true,
    city: true,
    totalCapital: true,
    needs: {
      select: {
        type: true,
        isFilled: true,
        equityShare: true,
      },
    },
    images: {
      select: {
        storagePath: true,
      },
      orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      take: 3,
    },
  } satisfies Prisma.ProjectSelect;

  const openProjects = await prisma.project.findMany({
    where: {
      ...baseWhere,
      needs: {
        some: {
          isFilled: false,
        },
      },
    },
    select: baseSelect,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: safeLimit,
  });

  if (openProjects.length >= safeLimit) {
    const ownerEquityPercentByProjectId = await getOwnerEquityPercentByProjectIds(
      openProjects.map((project) => project.id)
    );
    return openProjects
      .map((project) =>
        mapProjectRecordToListItem(project, ownerEquityPercentByProjectId)
      )
      .slice(0, safeLimit);
  }

  const remaining = safeLimit - openProjects.length;
  const openIds = openProjects.map((project) => project.id);
  const fallbackProjects = await prisma.project.findMany({
    where: {
      ...baseWhere,
      ...(openIds.length > 0 ? { id: { notIn: openIds } } : {}),
    },
    select: baseSelect,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: remaining,
  });

  const ownerEquityPercentByProjectId = await getOwnerEquityPercentByProjectIds(
    [...openProjects, ...fallbackProjects].map((project) => project.id)
  );

  return [...openProjects, ...fallbackProjects].map((project) =>
    mapProjectRecordToListItem(project, ownerEquityPercentByProjectId)
  );
}
