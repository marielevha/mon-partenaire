import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreateProjectForm,
  type ProjectFormValues,
} from "@/components/dashboard/CreateProjectForm";
import {
  buildProjectDocumentPublicUrl,
  buildProjectImagePublicUrl,
  getProjectNeedsByProjectId,
} from "@/src/lib/projects";
import prisma from "@/src/lib/prisma";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier un projet | Dashboard | Mon partenaire",
  description: "Mettez à jour les informations de votre projet depuis le dashboard.",
};

type DashboardEditProjectPageProps = {
  params: { id: string };
};

export default async function DashboardEditProjectPage({
  params,
}: DashboardEditProjectPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const resolvedParams = params ? await params : undefined;
  const projectId = resolvedParams?.id;

  if (!projectId) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      city: true,
      summary: true,
      description: true,
      category: true,
      equityModel: true,
      visibility: true,
      legalForm: true,
      totalCapital: true,
      ownerContribution: true,
      equityNote: true,
      companyCreated: true,
      country: true,
      _count: {
        select: {
          images: true,
        },
      },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          storagePath: true,
          alt: true,
        },
      },
    },
  });

  if (!project) {
    redirect("/dashboard");
  }

  const ownerEquityRows = await prisma.$queryRaw<
    Array<{ ownerEquityPercent: number | null }>
  >`
    SELECT "ownerEquityPercent"
    FROM "Project"
    WHERE "id" = ${project.id}
    LIMIT 1
  `;
  const ownerEquityPercent = ownerEquityRows[0]?.ownerEquityPercent ?? null;

  const initialValues: ProjectFormValues = {
    title: project.title,
    city: project.city,
    summary: project.summary,
    description: project.description,
    category: project.category,
    equityModel: project.equityModel,
    visibility: project.visibility,
    legalForm: project.legalForm ?? "",
    totalCapital:
      typeof project.totalCapital === "number" ? String(project.totalCapital) : "",
    ownerContribution:
      typeof project.ownerContribution === "number"
        ? String(project.ownerContribution)
        : "",
    ownerEquityPercent:
      typeof ownerEquityPercent === "number"
        ? String(ownerEquityPercent)
        : "",
    equityNote: project.equityNote ?? "",
    companyCreated: project.companyCreated,
    country: project.country,
  };
  const existingImages = project.images.map((image, index) => ({
    id: image.id,
    url: buildProjectImagePublicUrl(image.storagePath),
    alt: image.alt || `${project.title} - image ${index + 1}`,
  }));
  const existingDocuments = await prisma.$queryRaw<
    Array<{
      id: string;
      storagePath: string;
      originalName: string;
      mimeType: string | null;
      sizeBytes: number | null;
    }>
  >`
    SELECT "id", "storagePath", "originalName", "mimeType", "sizeBytes"
    FROM "ProjectDocument"
    WHERE "projectId" = ${project.id}
    ORDER BY "sortOrder" ASC, "createdAt" ASC
  `.catch((error) => {
    const isMissingTable =
      String(error).includes("P2021") ||
      String(error).includes("ProjectDocument") ||
      String(error).includes('relation "ProjectDocument" does not exist');
    if (isMissingTable) {
      return [];
    }
    throw error;
  });
  const mappedDocuments = existingDocuments.map((document) => ({
    id: document.id,
    name: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    url: buildProjectDocumentPublicUrl(document.storagePath),
  }));
  const existingNeeds = await getProjectNeedsByProjectId(project.id);

  return (
    <section className="space-y-6">
      <div className="dashboard-panel rounded-2xl p-6">
        <div className="dashboard-faint mb-3 flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/projects" className="transition-colors hover:text-accent">
            Mes projets
          </Link>
          <span>/</span>
          <span className="dashboard-muted">Modifier le projet</span>
        </div>
        <h1 className="text-3xl font-semibold">Mettre à jour le projet</h1>
        <p className="dashboard-faint mt-2 max-w-3xl text-sm">
          Ajustez les informations stratégiques, financières et visuelles de votre
          projet. Les nouvelles images ajoutées seront intégrées à la galerie existante.
        </p>
        <p className="dashboard-faint mt-2 text-xs">
          Images existantes: {project._count.images} • Documents existants:{" "}
          {mappedDocuments.length}
        </p>
      </div>

      <div className="dashboard-panel rounded-2xl p-6">
        <CreateProjectForm
          mode="edit"
          initialValues={initialValues}
          projectId={project.id}
          existingImages={existingImages}
          existingDocuments={mappedDocuments}
          existingNeeds={existingNeeds}
        />
      </div>
    </section>
  );
}
