"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ProjectFormState } from "@/app/dashboard/actions";
import { createProjectAction } from "@/app/dashboard/actions";
import { cn } from "@/components/ui/utils";

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
  equityNote: string;
  companyCreated: boolean;
  country: string;
};

type ProjectFormAction = (
  prevState: ProjectFormState,
  formData: FormData
) => Promise<ProjectFormState>;

type CreateProjectFormProps = {
  mode?: "create" | "edit";
  action?: ProjectFormAction;
  initialValues?: Partial<ProjectFormValues>;
  projectId?: string;
  existingImages?: Array<{
    id: string;
    url: string | null;
    alt: string;
  }>;
};

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
  equityNote:
    "Ouvert à un partenaire opérationnel et financier avec gouvernance progressive.",
  companyCreated: true,
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

function buildFormValues(initialValues?: Partial<ProjectFormValues>): ProjectFormValues {
  return {
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
    legalForm: initialValues?.legalForm ?? DEFAULT_FORM_VALUES.legalForm,
    totalCapital: initialValues?.totalCapital ?? DEFAULT_FORM_VALUES.totalCapital,
    ownerContribution:
      initialValues?.ownerContribution ?? DEFAULT_FORM_VALUES.ownerContribution,
    equityNote: initialValues?.equityNote ?? DEFAULT_FORM_VALUES.equityNote,
    country: initialValues?.country ?? DEFAULT_FORM_VALUES.country,
    companyCreated:
      typeof initialValues?.companyCreated === "boolean"
        ? initialValues.companyCreated
        : DEFAULT_FORM_VALUES.companyCreated,
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
  action,
  initialValues,
  projectId,
  existingImages = [],
}: CreateProjectFormProps) {
  const formActionFn = action ?? createProjectAction;
  const [state, formAction] = useActionState(formActionFn, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const isCreateMode = mode === "create";
  const values = useMemo(() => buildFormValues(initialValues), [initialValues]);
  const resultProjectId = state?.ok ? state.projectId : projectId;
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<
    SelectedImagePreview[]
  >([]);
  const [selectedRemovalImageIds, setSelectedRemovalImageIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedRemovalImageIds((prevIds) =>
      prevIds.filter((id) => existingImages.some((image) => image.id === id))
    );
  }, [existingImages]);

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

  const allExistingImagesSelected =
    existingImages.length > 0 &&
    selectedRemovalImageIds.length === existingImages.length;

  const handleToggleAllExistingImages = () => {
    if (allExistingImagesSelected) {
      setSelectedRemovalImageIds([]);
      return;
    }
    setSelectedRemovalImageIds(existingImages.map((image) => image.id));
  };

  const handleToggleExistingImage = (imageId: string) => {
    setSelectedRemovalImageIds((prevIds) =>
      prevIds.includes(imageId)
        ? prevIds.filter((id) => id !== imageId)
        : [...prevIds, imageId]
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
      setSelectedRemovalImageIds([]);
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
          <span className="dashboard-faint">Titre</span>
          <input
            name="title"
            defaultValue={values.title}
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.title && "border-rose-400")}
            placeholder="Ex: Usine de transformation locale"
            required
          />
          {state?.ok === false && state.fieldErrors?.title ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.title}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Ville</span>
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
        <span className="dashboard-faint">Résumé</span>
        <textarea
          name="summary"
          defaultValue={values.summary}
          className={cn(inputStyles, "min-h-[84px]", state?.ok === false && state.fieldErrors?.summary && "border-rose-400")}
          placeholder="Décrivez le positionnement du projet en quelques lignes."
          required
        />
        {state?.ok === false && state.fieldErrors?.summary ? (
          <p className="text-xs text-rose-500 dark:text-rose-300">{state.fieldErrors.summary}</p>
        ) : null}
      </label>

      <label className="space-y-1 text-sm">
        <span className="dashboard-faint">Description complète</span>
        <textarea
          name="description"
          defaultValue={values.description}
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
          <span className="dashboard-faint">Catégorie</span>
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
          <span className="dashboard-faint">Modèle</span>
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
          <span className="dashboard-faint">Visibilité</span>
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
          <span className="dashboard-faint">Forme légale</span>
          <select name="legalForm" className={inputStyles} defaultValue={values.legalForm}>
            <option value="">Non définie</option>
            <option value="SARL">SARL</option>
            <option value="SA">SA</option>
            <option value="AUTOENTREPRENEUR">Auto-entrepreneur</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Capital total recherché (FCFA)</span>
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
          <span className="dashboard-faint">Apport du porteur (FCFA)</span>
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
      </div>

      <label className="space-y-1 text-sm">
        <span className="dashboard-faint">Note sur le partenariat (optionnel)</span>
        <textarea
          name="equityNote"
          defaultValue={values.equityNote}
          className={cn(inputStyles, "min-h-[90px]")}
          placeholder="Ex: Ouvert à une gouvernance partagée et à un pacte d'associés progressif."
        />
      </label>

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

        {mode === "edit" ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="dashboard-faint text-xs">Images existantes</p>
              {existingImages.length > 0 ? (
                <button
                  type="button"
                  onClick={handleToggleAllExistingImages}
                  className="dashboard-btn-secondary rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
                >
                  {allExistingImagesSelected ? "Tout conserver" : "Tout retirer"}
                </button>
              ) : null}
            </div>
            {existingImages.length === 0 ? (
              <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-xs">
                Aucune image enregistrée pour ce projet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingImages.map((image, index) => (
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

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="dashboard-faint">Images (JPG, PNG, WEBP)</span>
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
            <span className="dashboard-faint">Documents</span>
            <input
              type="file"
              name="projectDocuments"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className={fileInputStyles}
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
      </div>

      <div className="dashboard-panel-soft flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
        <label className="dashboard-faint inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="companyCreated"
            defaultChecked={values.companyCreated}
            className="h-4 w-4 rounded border-slate-400 bg-transparent text-accent focus:ring-accent/45"
          />
          Entreprise déjà créée
        </label>

        <input type="hidden" name="country" value={values.country || "CG"} />
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
