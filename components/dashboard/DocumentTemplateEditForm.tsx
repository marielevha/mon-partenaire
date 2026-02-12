"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createDocumentTemplateAction,
  updateDocumentTemplateAction,
  type DocumentTemplateFormState,
} from "@/app/dashboard/document-templates/actions";
import { cn } from "@/components/ui/utils";

const initialState: DocumentTemplateFormState = null;

const inputStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

const textareaStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";
const fileInputStyles =
  "dashboard-input w-full rounded-lg border-dashed px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

const CATEGORY_OPTIONS = [
  { value: "BUSINESS_STRATEGY", label: "Business & Strategie" },
  { value: "LEGAL_CREATION", label: "Juridique & Creation" },
  { value: "FINANCE_INVESTMENT", label: "Finance & Investissement" },
  { value: "LOCAL_SECTORS", label: "Secteurs congolais" },
] as const;

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Debutant" },
  { value: "ADVANCED", label: "Avance" },
] as const;

const FILE_TYPE_OPTIONS = [
  { value: "PDF", label: "PDF" },
  { value: "DOCX", label: "DOCX" },
  { value: "EDITABLE_ONLINE", label: "Editable online" },
] as const;

const OBJECTIVE_OPTIONS = [
  { value: "CREATE_BUSINESS", label: "Creer entreprise" },
  { value: "RAISE_FUNDS", label: "Lever des fonds" },
  { value: "FORMALIZE_PARTNERSHIP", label: "Formaliser partenariat" },
] as const;

export type DocumentTemplateFormValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  level: string;
  fileType: string;
  objective: string;
  sectorTags: string[];
  highlight: string;
  attachedDocumentUrl: string | null;
  attachedDocumentName: string | null;
  attachedDocumentMimeType: string | null;
  attachedDocumentSizeBytes: number | null;
  isPublished: boolean;
  isFeatured: boolean;
};

const DEFAULT_TEMPLATE_VALUES: DocumentTemplateFormValues = {
  title: "Business plan boulangerie de quartier",
  slug: "business-plan-boulangerie-quartier",
  summary:
    "Modèle de business plan prêt à adapter pour lancer une boulangerie artisanale locale.",
  category: "BUSINESS_STRATEGY",
  level: "BEGINNER",
  fileType: "DOCX",
  objective: "CREATE_BUSINESS",
  sectorTags: ["Commerce", "Transformation agro", "Tous secteurs"],
  highlight:
    "Inclut estimation des coûts d'équipement, plan de production quotidien et stratégie de vente locale.",
  attachedDocumentUrl: null,
  attachedDocumentName: null,
  attachedDocumentMimeType: null,
  attachedDocumentSizeBytes: null,
  isPublished: false,
  isFeatured: false,
};

type SelectedAttachmentPreview = {
  name: string;
  mimeType: string;
  sizeBytes: number;
};

function detectTemplateFileType(file: File): "PDF" | "DOCX" | "EDITABLE_ONLINE" {
  const mime = file.type.toLowerCase();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? ""
    : "";

  if (mime === "application/pdf" || extension === "pdf") {
    return "PDF";
  }

  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "doc" ||
    extension === "docx"
  ) {
    return "DOCX";
  }

  return "EDITABLE_ONLINE";
}

function formatFileSize(sizeBytes?: number | null) {
  if (typeof sizeBytes !== "number" || Number.isNaN(sizeBytes) || sizeBytes < 0) {
    return "Taille inconnue";
  }

  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const idleLabel = mode === "create" ? "Créer le template" : "Enregistrer";
  const pendingLabel = mode === "create" ? "Création..." : "Enregistrement...";

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
        idleLabel
      )}
    </button>
  );
}

export function DocumentTemplateEditForm({
  template,
  mode = "edit",
}: {
  template?: Partial<DocumentTemplateFormValues>;
  mode?: "create" | "edit";
}) {
  const formValues = {
    ...DEFAULT_TEMPLATE_VALUES,
    ...template,
    sectorTags:
      template?.sectorTags && template.sectorTags.length > 0
        ? template.sectorTags
        : DEFAULT_TEMPLATE_VALUES.sectorTags,
  };
  const formActionHandler =
    mode === "create" ? createDocumentTemplateAction : updateDocumentTemplateAction;
  const [state, formAction] = useActionState(formActionHandler, initialState);
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const [removeAttachedDocument, setRemoveAttachedDocument] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState(formValues.fileType);
  const [selectedAttachmentPreview, setSelectedAttachmentPreview] =
    useState<SelectedAttachmentPreview | null>(null);

  const hasExistingAttachment = mode === "edit" && Boolean(formValues.attachedDocumentName);

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedAttachmentPreview(null);
      return;
    }

    setSelectedAttachmentPreview({
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    });
    setSelectedFileType(detectTemplateFileType(file));
    setRemoveAttachedDocument(false);
  };

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && formValues.id ? (
        <input type="hidden" name="templateId" value={formValues.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="dashboard-faint">Titre</span>
          <input
            name="title"
            defaultValue={formValues.title}
            required
            className={cn(
              inputStyles,
              fieldErrors?.title ? "border-rose-400" : undefined
            )}
          />
          {fieldErrors?.title ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.title}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Slug</span>
          <input
            name="slug"
            defaultValue={formValues.slug}
            required
            className={cn(
              inputStyles,
              fieldErrors?.slug ? "border-rose-400" : undefined
            )}
          />
          {fieldErrors?.slug ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.slug}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Catégorie</span>
          <select
            name="category"
            defaultValue={formValues.category}
            className={cn(
              inputStyles,
              fieldErrors?.category ? "border-rose-400" : undefined
            )}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors?.category ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">
              {fieldErrors.category}
            </p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="dashboard-faint">Résumé</span>
          <textarea
            name="summary"
            defaultValue={formValues.summary}
            required
            rows={3}
            className={cn(
              textareaStyles,
              fieldErrors?.summary ? "border-rose-400" : undefined
            )}
          />
          {fieldErrors?.summary ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.summary}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Niveau</span>
          <select
            name="level"
            defaultValue={formValues.level}
            className={cn(
              inputStyles,
              fieldErrors?.level ? "border-rose-400" : undefined
            )}
          >
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors?.level ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.level}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Type de fichier</span>
          <select
            name="fileType"
            value={selectedFileType}
            onChange={(event) => setSelectedFileType(event.target.value)}
            className={cn(
              inputStyles,
              fieldErrors?.fileType ? "border-rose-400" : undefined
            )}
          >
            {FILE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors?.fileType ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.fileType}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Objectif</span>
          <select
            name="objective"
            defaultValue={formValues.objective}
            className={cn(
              inputStyles,
              fieldErrors?.objective ? "border-rose-400" : undefined
            )}
          >
            {OBJECTIVE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors?.objective ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">
              {fieldErrors.objective}
            </p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="dashboard-faint">Secteurs (séparés par virgules)</span>
          <input
            name="sectorTags"
            defaultValue={formValues.sectorTags.join(", ")}
            className={cn(
              inputStyles,
              fieldErrors?.sectorTags ? "border-rose-400" : undefined
            )}
          />
          {fieldErrors?.sectorTags ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">
              {fieldErrors.sectorTags}
            </p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="dashboard-faint">Point clé</span>
          <textarea
            name="highlight"
            defaultValue={formValues.highlight}
            rows={3}
            required
            className={cn(
              textareaStyles,
              fieldErrors?.highlight ? "border-rose-400" : undefined
            )}
          />
          {fieldErrors?.highlight ? (
            <p className="text-xs text-rose-500 dark:text-rose-300">{fieldErrors.highlight}</p>
          ) : null}
        </label>

        <div className="space-y-3 text-sm sm:col-span-2">
          <p className="dashboard-faint">Pièce jointe</p>

          {hasExistingAttachment ? (
            <div className="dashboard-panel-soft rounded-xl border border-border/70 p-3">
              <p className="dashboard-faint text-xs uppercase tracking-wide">
                Document existant
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  {formValues.attachedDocumentUrl ? (
                    <a
                      href={formValues.attachedDocumentUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium text-accent underline underline-offset-2"
                    >
                      {formValues.attachedDocumentName}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-medium">
                      {formValues.attachedDocumentName}
                    </p>
                  )}
                  <p className="dashboard-faint mt-0.5 text-xs">
                    {formValues.attachedDocumentMimeType || "application/octet-stream"} ·{" "}
                    {formatFileSize(formValues.attachedDocumentSizeBytes)}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="removeAttachedDocument"
                    checked={removeAttachedDocument}
                    onChange={(event) => setRemoveAttachedDocument(event.target.checked)}
                    className="h-4 w-4 rounded border-border/70"
                  />
                  <span>Retirer</span>
                </label>
              </div>
            </div>
          ) : null}

          <label className="space-y-1 text-sm">
            <span className="dashboard-faint">Remplacer / Ajouter un document</span>
            <input
              type="file"
              name="attachedDocument"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.json"
              className={cn(
                fileInputStyles,
                fieldErrors?.attachedDocument ? "border-rose-400" : undefined
              )}
              onChange={handleAttachmentChange}
            />
            <p className="dashboard-faint text-xs">
              Formats: PDF, Word, Excel, PowerPoint, CSV, TXT, JSON (max 20 MB).
            </p>
            {fieldErrors?.attachedDocument ? (
              <p className="text-xs text-rose-500 dark:text-rose-300">
                {fieldErrors.attachedDocument}
              </p>
            ) : null}
          </label>

          {selectedAttachmentPreview ? (
            <div className="dashboard-panel-soft rounded-xl border border-border/70 p-3">
              <p className="dashboard-faint text-xs uppercase tracking-wide">
                Nouveau document sélectionné
              </p>
              <p className="mt-1 text-sm font-medium">{selectedAttachmentPreview.name}</p>
              <p className="dashboard-faint mt-0.5 text-xs">
                {selectedAttachmentPreview.mimeType} ·{" "}
                {formatFileSize(selectedAttachmentPreview.sizeBytes)}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="dashboard-panel-soft flex items-center gap-2 rounded-lg p-3 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={formValues.isPublished}
            className="h-4 w-4 rounded border-border/70"
          />
          <span>Publié</span>
        </label>

        <label className="dashboard-panel-soft flex items-center gap-2 rounded-lg p-3 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={formValues.isFeatured}
            className="h-4 w-4 rounded border-border/70"
          />
          <span>Mis en avant</span>
        </label>
      </div>

      {state?.message ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200"
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton mode={mode} />
        <Link
          href="/dashboard/document-templates"
          className="dashboard-btn-secondary rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          Retour à la liste
        </Link>
      </div>
    </form>
  );
}
