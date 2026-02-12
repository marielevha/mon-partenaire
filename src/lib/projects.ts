import type {
  EquityModel,
  LegalForm,
  Prisma,
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
  equityModel: EquityModel;
  equityNote: string | null;
  visibility: ProjectVisibility;
};

export async function createProjectDraft(input: CreateProjectDraftInput) {
  return prisma.project.create({
    data: {
      ...input,
      status: "DRAFT",
    },
    select: {
      id: true,
    },
  });
}

export function buildProjectImagePublicUrl(storagePath: string): string | null {
  return resolveS3PublicUrlFromStoredValue(storagePath);
}

export function buildProjectDocumentPublicUrl(storagePath: string): string | null {
  return resolveS3DocumentPublicUrlFromStoredValue(storagePath);
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
        },
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

  return filtered.map((p) => {
    const remainingNeeds = p.needs.filter((n) => !n.isFilled).length;
    const needTypes = Array.from(new Set(p.needs.filter((n) => !n.isFilled).map((n) => n.type)));
    return {
      id: p.id,
      title: p.title,
      summary: p.summary,
      category: p.category,
      city: p.city,
      totalCapital: p.totalCapital,
      remainingNeeds,
      needTypes,
    };
  });
}
