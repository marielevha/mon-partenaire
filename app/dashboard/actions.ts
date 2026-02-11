"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";

type CreateProjectSuccess = {
  ok: true;
  message: string;
  projectId: string;
};

type CreateProjectError = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<
    | "title"
    | "summary"
    | "description"
    | "category"
    | "city"
    | "totalCapital"
    | "ownerContribution"
    | "equityModel"
    | "visibility",
    string
  >>;
};

export type CreateProjectState = CreateProjectSuccess | CreateProjectError | null;

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

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
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

  const companyCreated = formData.get("companyCreated") === "on";
  const totalCapital = parseOptionalNumber(getValue(formData, "totalCapital"));
  const ownerContribution = parseOptionalNumber(getValue(formData, "ownerContribution"));

  const fieldErrors: CreateProjectError["fieldErrors"] = {};

  if (title.length < 4 || title.length > 120) {
    fieldErrors.title = "Le titre doit contenir entre 4 et 120 caractères.";
  }

  if (summary.length < 20 || summary.length > 220) {
    fieldErrors.summary = "Le résumé doit contenir entre 20 et 220 caractères.";
  }

  if (description.length < 80 || description.length > 6000) {
    fieldErrors.description = "La description doit contenir entre 80 et 6000 caractères.";
  }

  if (!PROJECT_CATEGORIES.includes(category as (typeof PROJECT_CATEGORIES)[number])) {
    fieldErrors.category = "Catégorie invalide.";
  }

  if (city.length < 2 || city.length > 80) {
    fieldErrors.city = "La ville doit contenir entre 2 et 80 caractères.";
  }

  if (!EQUITY_MODELS.includes(equityModel as (typeof EQUITY_MODELS)[number])) {
    fieldErrors.equityModel = "Modèle de partenariat invalide.";
  }

  if (!VISIBILITIES.includes(visibility as (typeof VISIBILITIES)[number])) {
    fieldErrors.visibility = "Visibilité invalide.";
  }

  if (Number.isNaN(totalCapital as number) || (typeof totalCapital === "number" && totalCapital < 0)) {
    fieldErrors.totalCapital = "Capital total invalide.";
  }

  if (
    Number.isNaN(ownerContribution as number) ||
    (typeof ownerContribution === "number" && ownerContribution < 0)
  ) {
    fieldErrors.ownerContribution = "Apport du porteur invalide.";
  }

  if (
    typeof totalCapital === "number" &&
    typeof ownerContribution === "number" &&
    ownerContribution > totalCapital
  ) {
    fieldErrors.ownerContribution = "L'apport du porteur ne peut pas dépasser le capital total.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Certains champs sont invalides.",
      fieldErrors,
    };
  }

  const project = await prisma.project.create({
    data: {
      ownerId: session.user.id,
      title,
      summary,
      description,
      category: category as (typeof PROJECT_CATEGORIES)[number],
      city,
      country: country.slice(0, 2).toUpperCase(),
      status: "DRAFT",
      legalForm: legalForm
        ? (LEGAL_FORMS.includes(legalForm as (typeof LEGAL_FORMS)[number])
            ? (legalForm as (typeof LEGAL_FORMS)[number])
            : null)
        : null,
      companyCreated,
      totalCapital,
      ownerContribution,
      equityModel: equityModel as (typeof EQUITY_MODELS)[number],
      equityNote: equityNote || null,
      visibility: visibility as (typeof VISIBILITIES)[number],
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");

  return {
    ok: true,
    message: "Projet créé avec succès. Vous pouvez maintenant ajouter les besoins.",
    projectId: project.id,
  };
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
