"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ProjectFormState } from "@/app/dashboard/actions";
import { createProjectAction, updateProjectAction } from "@/app/dashboard/actions";
import {
  NeedsForm,
  type EditableProjectNeed,
} from "@/components/dashboard/NeedsForm";
import { FieldHelp } from "@/components/ui/field-help";
import { cn } from "@/components/ui/utils";
import { normalizeProjectNeedType } from "@/src/lib/project-needs";

const initialState: ProjectFormState = null;

const inputStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";
const fileInputStyles =
  "dashboard-input w-full rounded-lg border-dashed px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

export type ProjectFormValues = {
  title: string;
  city: string;
  summary: string;
  description: string;
  category: string;
  equityModel: string;
  visibility: string;
  legalForm: string;
  totalCapital: string;
  ownerContribution: string;
  ownerEquityPercent: string;
  equityNote: string;
  companyCreated: boolean;
  country: string;
};

type CreateProjectFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<ProjectFormValues>;
  projectId?: string;
  existingImages?: Array<{
    id: string;
    url: string | null;
    alt: string;
  }>;
  existingDocuments?: Array<{
    id: string;
    name: string;
    url: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
  existingNeeds?: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    amount: number | null;
    requiredCount: number | null;
    equityPercent: number | null;
    skillTags: string[];
    isFilled: boolean;
  }>;
};

const EMPTY_EXISTING_IMAGES: NonNullable<CreateProjectFormProps["existingImages"]> = [];
const EMPTY_EXISTING_DOCUMENTS: NonNullable<CreateProjectFormProps["existingDocuments"]> =
  [];
const EMPTY_EXISTING_NEEDS: NonNullable<CreateProjectFormProps["existingNeeds"]> = [];

const DEFAULT_FORM_VALUES: ProjectFormValues = {
  title: "Atelier agroalimentaire de proximité",
  city: "Brazzaville",
  summary:
    "Un atelier local de transformation des fruits avec distribution B2B aux commerces de quartier.",
  description:
    "Le projet vise à créer un atelier agroalimentaire semi-industriel capable de transformer des fruits locaux en jus et confitures. Le modèle combine des contrats d'approvisionnement avec des producteurs, un circuit de distribution court vers des supérettes partenaires, et un plan de montée en capacité sur 18 mois. Le besoin immédiat porte sur l'équipement, la logistique froide et l'encadrement qualité.",
  category: "AGRIBUSINESS",
  equityModel: "EQUITY",
  visibility: "PUBLIC",
  legalForm: "SARL",
  totalCapital: "12000000",
  ownerContribution: "3000000",
  ownerEquityPercent: "40",
  equityNote:
    "Ouvert à un partenaire opérationnel et financier avec gouvernance progressive.",
  companyCreated: false,
  country: "CG",
};

const CITY_OPTIONS = [
  "Brazzaville",
  "Pointe-Noire",
  "Dolisie",
  "Nkayi",
  "Owando",
  "Ouesso",
  "Oyo",
  "Impfondo",
  "Sibiti",
  "Kinkala",
  "Mossendjo",
  "Autre",
];

type SelectedImagePreview = {
  key: string;
  url: string;
  name: string;
};

type SelectedDocumentPreview = {
  key: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

function keepOnlyExistingIds(previousIds: string[], existingIds: Set<string>) {
  let hasChanged = false;
  const nextIds: string[] = [];

  for (const id of previousIds) {
    if (existingIds.has(id)) {
      nextIds.push(id);
    } else {
      hasChanged = true;
    }
  }

  return hasChanged ? nextIds : previousIds;
}

function formatFileSize(sizeBytes?: number | null) {
  if (typeof sizeBytes !== "number" || Number.isNaN(sizeBytes) || sizeBytes < 0) {
    return "Taille inconnue";
  }

  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFormValues(initialValues?: Partial<ProjectFormValues>): ProjectFormValues {
  return {
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
    legalForm: initialValues?.legalForm ?? DEFAULT_FORM_VALUES.legalForm,
    totalCapital: initialValues?.totalCapital ?? DEFAULT_FORM_VALUES.totalCapital,
    ownerContribution:
      initialValues?.ownerContribution ?? DEFAULT_FORM_VALUES.ownerContribution,
    ownerEquityPercent:
      initialValues?.ownerEquityPercent ?? DEFAULT_FORM_VALUES.ownerEquityPercent,
    equityNote: initialValues?.equityNote ?? DEFAULT_FORM_VALUES.equityNote,
    country: initialValues?.country ?? DEFAULT_FORM_VALUES.country,
    companyCreated:
      typeof initialValues?.companyCreated === "boolean"
        ? initialValues.companyCreated
        : DEFAULT_FORM_VALUES.companyCreated,
  };
}

function mapExistingNeedToEditableNeed(
  need: NonNullable<CreateProjectFormProps["existingNeeds"]>[number]
): EditableProjectNeed {
  const normalizedType = normalizeProjectNeedType(need.type) ?? "FINANCIAL";

  return {
    clientId: need.id,
    type: normalizedType,
    title: need.title ?? "",
    description: need.description ?? "",
    amount: typeof need.amount === "number" ? String(need.amount) : "",
    requiredCount:
      typeof need.requiredCount === "number" ? String(need.requiredCount) : "",
    equityPercent:
      typeof need.equityPercent === "number" ? String(need.equityPercent) : "",
    skillTags: need.skillTags.join(", "),
    isFilled: need.isFilled,
  };
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const submitLabel = mode === "edit" ? "Enregistrer les modifications" : "Créer le projet";
  const pendingLabel = mode === "edit" ? "Enregistrement..." : "Création...";

  return (
    <button
      type="submit"
      disabled={pending}
      className="dashboard-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 animate-spin"
            fill="none"
          >
            <circle
              cx="10"
              cy="10"
              r="7"
              className="opacity-25"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M17 10a7 7 0 0 0-7-7"
              className="opacity-90"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>{pendingLabel}</span>
        </>
      ) : (
        submitLabel
      )}
    </button>
  );
}

export function CreateProjectForm({
  mode = "create",
  initialValues,
  projectId,
  existingImages,
  existingDocuments,
  existingNeeds,
}: CreateProjectFormProps) {
  const [createState, createFormAction] = useActionState(
    createProjectAction,
    initialState
  );
  const [editState, editFormAction] = useActionState(updateProjectAction, initialState);
  const state = mode === "edit" ? editState : createState;
  const formAction = mode === "edit" ? editFormAction : createFormAction;
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const isCreateMode = mode === "create";
  const existingImageItems = existingImages ?? EMPTY_EXISTING_IMAGES;
  const existingDocumentItems = existingDocuments ?? EMPTY_EXISTING_DOCUMENTS;
  const existingNeedItems = existingNeeds ?? EMPTY_EXISTING_NEEDS;
  const values = useMemo(() => buildFormValues(initialValues), [initialValues]);
  const initialNeeds = useMemo(
    () => existingNeedItems.map(mapExistingNeedToEditableNeed),
    [existingNeedItems]
  );
  const resultProjectId = state?.ok ? state.projectId : projectId;
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<
    SelectedImagePreview[]
  >([]);
  const [selectedDocumentPreviews, setSelectedDocumentPreviews] = useState<
    SelectedDocumentPreview[]
  >([]);
  const [selectedRemovalImageIds, setSelectedRemovalImageIds] = useState<string[]>([]);
  const [selectedRemovalDocumentIds, setSelectedRemovalDocumentIds] = useState<string[]>(
    []
  );
  const [editableNeeds, setEditableNeeds] = useState<EditableProjectNeed[]>(
    initialNeeds
  );

  const serializedNeedsPayload = useMemo(
    () =>
      JSON.stringify(
        editableNeeds.map((need) => ({
          type: need.type,
          title: need.title,
          description: need.description,
          amount: need.amount,
          requiredCount: need.requiredCount,
          equityPercent: need.equityPercent,
          skillTags: need.skillTags,
          isFilled: need.isFilled,
        }))
      ),
    [editableNeeds]
  );

  useEffect(() => {
    const existingImageIds = new Set(existingImageItems.map((image) => image.id));
    setSelectedRemovalImageIds((prevIds) =>
      keepOnlyExistingIds(prevIds, existingImageIds)
    );
  }, [existingImageItems]);

  useEffect(() => {
    const existingDocumentIds = new Set(
      existingDocumentItems.map((document) => document.id)
    );
    setSelectedRemovalDocumentIds((prevIds) =>
      keepOnlyExistingIds(prevIds, existingDocumentIds)
    );
  }, [existingDocumentItems]);

  useEffect(() => {
    setEditableNeeds(initialNeeds);
  }, [initialNeeds]);

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [selectedImagePreviews]);

  const handleProjectImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    setSelectedImagePreviews((prevPreviews) => {
      prevPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });

      return files.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
    });
  };

  const handleProjectDocumentsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    setSelectedDocumentPreviews(
      files.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      }))
    );
  };

  const allExistingImagesSelected =
    existingImageItems.length > 0 &&
    selectedRemovalImageIds.length === existingImageItems.length;

  const handleToggleAllExistingImages = () => {
    if (allExistingImagesSelected) {
      setSelectedRemovalImageIds([]);
      return;
    }
    setSelectedRemovalImageIds(existingImageItems.map((image) => image.id));
  };

  const handleToggleExistingImage = (imageId: string) => {
    setSelectedRemovalImageIds((prevIds) =>
      prevIds.includes(imageId)
        ? prevIds.filter((id) => id !== imageId)
        : [...prevIds, imageId]
    );
  };

  const allExistingDocumentsSelected =
    existingDocumentItems.length > 0 &&
    selectedRemovalDocumentIds.length === existingDocumentItems.length;

  const handleToggleAllExistingDocuments = () => {
    if (allExistingDocumentsSelected) {
      setSelectedRemovalDocumentIds([]);
      return;
    }
    setSelectedRemovalDocumentIds(existingDocumentItems.map((document) => document.id));
  };

  const handleToggleExistingDocument = (documentId: string) => {
    setSelectedRemovalDocumentIds((prevIds) =>
      prevIds.includes(documentId)
        ? prevIds.filter((id) => id !== documentId)
        : [...prevIds, documentId]
    );
  };

  useEffect(() => {
    if (state?.ok) {
      if (isCreateMode) {
        formRef.current?.reset();
      }
      setSelectedImagePreviews((prevPreviews) => {
        prevPreviews.forEach((preview) => {
          URL.revokeObjectURL(preview.url);
        });
        return [];
      });
      setSelectedDocumentPreviews([]);
      setSelectedRemovalImageIds([]);
      setSelectedRemovalDocumentIds([]);
      if (isCreateMode) {
        setEditableNeeds([]);
      }
      router.refresh();
    }
  }, [isCreateMode, router, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {isCreateMode ? (
        <p className="dashboard-faint rounded-lg border border-dashed border-accent/35 bg-accent/10 px-3 py-2 text-xs">
          Champs pré-remplis en mode test. Modifiez les valeurs avant publication.
        </p>
      ) : (
        <p className="dashboard-faint rounded-lg border border-dashed border-accent/35 bg-accent/10 px-3 py-2 text-xs">
          Modifiez les informations de votre projet puis enregistrez.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Titre
            <FieldHelp text="Nom court et explicite du projet (4 à 120 caractères)." />
          </span>
          <input
            name="title"
            defaultValue={values.title}
            minLength={4}
            maxLength={120}
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.title && "border-rose-400")}
            placeholder="Ex: Usine de transformation locale"
            required
          />
          {state?.ok === false && state.fieldErrors?.title ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.title}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Ville
            <FieldHelp text="Ville principale d'implantation ou d'activité du projet." />
          </span>
          <select
            name="city"
            defaultValue={values.city}
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.city && "border-rose-400")}
            required
          >
            <option value="" disabled>
              Sélectionner une ville
            </option>
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {state?.ok === false && state.fieldErrors?.city ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.city}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="dashboard-faint inline-flex items-center gap-1.5">
          Résumé
          <FieldHelp text="Synthèse du projet en 1 à 3 phrases (20 à 220 caractères)." />
        </span>
        <textarea
          name="summary"
          defaultValue={values.summary}
          minLength={20}
          maxLength={220}
          className={cn(inputStyles, "min-h-[84px]", state?.ok === false && state.fieldErrors?.summary && "border-rose-400")}
          placeholder="Décrivez le positionnement du projet en quelques lignes."
          required
        />
        {state?.ok === false && state.fieldErrors?.summary ? (
          <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.summary}</p>
        ) : null}
      </label>

      <label className="space-y-1 text-sm">
        <span className="dashboard-faint inline-flex items-center gap-1.5">
          Description complète
          <FieldHelp text="Décrivez le contexte, le marché, l'offre, les objectifs et le plan d'exécution (80 à 6000 caractères)." />
        </span>
        <textarea
          name="description"
          defaultValue={values.description}
          minLength={80}
          maxLength={6000}
          className={cn(inputStyles, "min-h-[150px]", state?.ok === false && state.fieldErrors?.description && "border-rose-400")}
          placeholder="Objectif, marché, modèle économique, équipe, jalons..."
          required
        />
        {state?.ok === false && state.fieldErrors?.description ? (
          <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.description}</p>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Catégorie
            <FieldHelp text="Secteur principal du projet (agri, tech, santé, etc.)." />
          </span>
          <select
            name="category"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.category && "border-rose-400")}
            defaultValue={values.category}
          >
            <option value="AGRIBUSINESS">Agribusiness</option>
            <option value="TECH">Tech</option>
            <option value="HEALTH">Santé</option>
            <option value="EDUCATION">Éducation</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Autre</option>
          </select>
          {state?.ok === false && state.fieldErrors?.category ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.category}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Modèle
            <FieldHelp text="Type de contrepartie proposé aux partenaires: sans equity, equity, ou partage de revenus." />
          </span>
          <select
            name="equityModel"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.equityModel && "border-rose-400")}
            defaultValue={values.equityModel}
          >
            <option value="NONE">Sans equity</option>
            <option value="EQUITY">Part en capital</option>
            <option value="REVENUE_SHARE">Partage de revenus</option>
          </select>
          {state?.ok === false && state.fieldErrors?.equityModel ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.equityModel}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Visibilité
            <FieldHelp text="Public: visible sur la plateforme. Privé: accessible uniquement dans l'espace propriétaire." />
          </span>
          <select
            name="visibility"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.visibility && "border-rose-400")}
            defaultValue={values.visibility}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Privé</option>
          </select>
          {state?.ok === false && state.fieldErrors?.visibility ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.visibility}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Forme légale
            <FieldHelp text="Statut juridique visé ou actuel de l'entreprise (optionnel)." />
          </span>
          <select name="legalForm" className={inputStyles} defaultValue={values.legalForm}>
            <option value="">Non définie</option>
            <option value="SARL">SARL</option>
            <option value="SA">SA</option>
            <option value="AUTOENTREPRENEUR">Auto-entrepreneur</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Capital total recherché (FCFA)
            <FieldHelp text="Montant total nécessaire pour financer le projet." />
          </span>
          <input
            name="totalCapital"
            type="number"
            min="0"
            step="1000"
            defaultValue={values.totalCapital}
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.totalCapital && "border-rose-400")}
            placeholder="12000000"
          />
          {state?.ok === false && state.fieldErrors?.totalCapital ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.totalCapital}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Apport du porteur (FCFA)
            <FieldHelp text="Montant que le porteur investit personnellement dans le projet." />
          </span>
          <input
            name="ownerContribution"
            type="number"
            min="0"
            step="1000"
            defaultValue={values.ownerContribution}
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.ownerContribution && "border-rose-400")}
            placeholder="3000000"
          />
          {state?.ok === false && state.fieldErrors?.ownerContribution ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.ownerContribution}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint inline-flex items-center gap-1.5">
            Parts du porteur (%)
            <FieldHelp text="Pourcentage de parts sociales réservé au porteur. La somme porteur + besoins ne doit pas dépasser 100%." />
          </span>
          <input
            name="ownerEquityPercent"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={values.ownerEquityPercent}
            className={cn(
              inputStyles,
              state?.ok === false &&
                state.fieldErrors?.ownerEquityPercent &&
                "border-rose-400"
            )}
            placeholder="40"
          />
          {state?.ok === false && state.fieldErrors?.ownerEquityPercent ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">
              {state.fieldErrors.ownerEquityPercent}
            </p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="dashboard-faint inline-flex items-center gap-1.5">
          Note sur le partenariat (optionnel)
          <FieldHelp text="Informations complémentaires sur les conditions de collaboration, la gouvernance ou les attentes partenaires." />
        </span>
        <textarea
          name="equityNote"
          defaultValue={values.equityNote}
          className={cn(inputStyles, "min-h-[90px]")}
          placeholder="Ex: Ouvert à une gouvernance partagée et à un pacte d'associés progressif."
        />
      </label>

      <NeedsForm
        value={editableNeeds}
        onChange={setEditableNeeds}
        error={state?.ok === false ? state.fieldErrors?.projectNeeds : undefined}
      />

      <div className="dashboard-panel-soft rounded-xl p-4">
        <h3 className="text-sm font-semibold">Médias du projet</h3>
        <p className="dashboard-faint mt-1 text-xs">
          Ajoutez des visuels pour renforcer la crédibilité de votre annonce.
        </p>
        {state?.ok === false && state.fieldErrors?.projectImages ? (
          <p className="mt-2 rounded-md border border-rose-300/60 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-200">
            {state.fieldErrors.projectImages}
          </p>
        ) : null}
        {state?.ok === false && state.fieldErrors?.projectDocuments ? (
          <p className="mt-2 rounded-md border border-rose-300/60 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-200">
            {state.fieldErrors.projectDocuments}
          </p>
        ) : null}

        {mode === "edit" ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="dashboard-faint text-xs">Images existantes</p>
              {existingImageItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleToggleAllExistingImages}
                  className="dashboard-btn-secondary rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                >
                  {allExistingImagesSelected ? "Tout conserver" : "Tout retirer"}
                </button>
              ) : null}
            </div>
            {existingImageItems.length === 0 ? (
              <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-xs">
                Aucune image enregistrée pour ce projet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingImageItems.map((image, index) => (
                  <label
                    key={image.id}
                    className="dashboard-panel rounded-lg border p-2 text-xs"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-md">
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="dashboard-faint flex h-full w-full items-center justify-center text-[11px]">
                          Image indisponible
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="dashboard-faint truncate">
                        Image {index + 1}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="removeImageIds"
                          value={image.id}
                          checked={selectedRemovalImageIds.includes(image.id)}
                          onChange={() => handleToggleExistingImage(image.id)}
                          className="h-3.5 w-3.5 rounded border-slate-400 bg-transparent text-rose-500 focus:ring-rose-400/45"
                        />
                        Retirer
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {mode === "edit" ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="dashboard-faint text-xs">Documents existants</p>
              {existingDocumentItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleToggleAllExistingDocuments}
                  className="dashboard-btn-secondary rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                >
                  {allExistingDocumentsSelected ? "Tout conserver" : "Tout retirer"}
                </button>
              ) : null}
            </div>

            {existingDocumentItems.length === 0 ? (
              <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-xs">
                Aucun document enregistré pour ce projet.
              </p>
            ) : (
              <div className="space-y-2">
                {existingDocumentItems.map((document) => (
                  <label
                    key={document.id}
                    className="dashboard-panel flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      {document.url ? (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-medium text-accent underline-offset-2 hover:underline"
                        >
                          {document.name}
                        </a>
                      ) : (
                        <p className="truncate font-medium">{document.name}</p>
                      )}
                      <p className="dashboard-faint mt-0.5">
                        {document.mimeType || "Type inconnu"} • {formatFileSize(document.sizeBytes)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <input
                        type="checkbox"
                        name="removeDocumentIds"
                        value={document.id}
                        checked={selectedRemovalDocumentIds.includes(document.id)}
                        onChange={() => handleToggleExistingDocument(document.id)}
                        className="h-3.5 w-3.5 rounded border-slate-400 bg-transparent text-rose-500 focus:ring-rose-400/45"
                      />
                      Retirer
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="dashboard-faint inline-flex items-center gap-1.5">
              Images (JPG, PNG, WEBP)
              <FieldHelp text="Ajoutez des visuels du projet. Maximum 10 images, 5 MB par fichier." />
            </span>
            <input
              type="file"
              name="projectImages"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className={fileInputStyles}
              onChange={handleProjectImagesChange}
            />
            <p className="dashboard-faint text-xs">
              {isCreateMode
                ? "Jusqu'à 10 images recommandées."
                : "Ajoutez de nouvelles images (elles seront ajoutées à la galerie existante)."}
            </p>
          </label>

          <label className="space-y-1 text-sm">
            <span className="dashboard-faint inline-flex items-center gap-1.5">
              Documents
              <FieldHelp text="Ajoutez des documents utiles: business plan, pitch deck, études, tableaux financiers, etc." />
            </span>
            <input
              type="file"
              name="projectDocuments"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.json"
              className={fileInputStyles}
              onChange={handleProjectDocumentsChange}
            />
            <p className="dashboard-faint text-xs">
              Pitch deck, business plan, étude de marché, etc.
            </p>
          </label>
        </div>

        {selectedImagePreviews.length > 0 ? (
          <div className="mt-3">
            <p className="dashboard-faint mb-2 text-xs">
              Prévisualisation des nouvelles images ({selectedImagePreviews.length})
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedImagePreviews.map((preview) => (
                <div key={preview.key} className="dashboard-panel rounded-lg border p-2 text-xs">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-md">
                    <Image
                      src={preview.url}
                      alt={preview.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="dashboard-faint mt-2 truncate">{preview.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {selectedDocumentPreviews.length > 0 ? (
          <div className="mt-3">
            <p className="dashboard-faint mb-2 text-xs">
              Documents sélectionnés ({selectedDocumentPreviews.length})
            </p>
            <div className="space-y-2">
              {selectedDocumentPreviews.map((preview) => (
                <div
                  key={preview.key}
                  className="dashboard-panel flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                >
                  <p className="truncate font-medium">{preview.name}</p>
                  <p className="dashboard-faint shrink-0">
                    {preview.mimeType} • {formatFileSize(preview.sizeBytes)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="dashboard-panel-soft flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
        <label className="dashboard-faint inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="companyCreated"
            defaultChecked={values.companyCreated}
            className="h-4 w-4 rounded border-slate-400 bg-transparent text-accent focus:ring-accent/45"
          />
          <span className="inline-flex items-center gap-1.5">
            Entreprise déjà créée
            <FieldHelp text="Cochez si l'entreprise est déjà constituée juridiquement." />
          </span>
        </label>

        <input type="hidden" name="country" value={values.country || "CG"} />
        <input
          type="hidden"
          name="projectNeedsPayload"
          value={serializedNeedsPayload}
        />
        {mode === "edit" ? (
          <input type="hidden" name="projectId" value={projectId} />
        ) : null}

        <div className="flex items-center gap-2">
          {resultProjectId ? (
            <Link
              href={`/projects/${resultProjectId}`}
              className="dashboard-btn-secondary rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            >
              Voir le projet
            </Link>
          ) : null}
          <SubmitButton mode={mode} />
        </div>
      </div>

      {state?.ok === false ? (
        <p className="rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {state.message}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default CreateProjectForm;
