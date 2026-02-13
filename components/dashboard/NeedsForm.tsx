"use client";

import type { ProjectNeedType } from "@/src/lib/project-needs";
import {
  PROJECT_NEED_TYPES,
  PROJECT_NEED_TYPE_LABELS,
  normalizeProjectNeedType,
} from "@/src/lib/project-needs";
import { FieldHelp } from "@/components/ui/field-help";

export type EditableProjectNeed = {
  clientId: string;
  type: ProjectNeedType;
  title: string;
  description: string;
  amount: string;
  requiredCount: string;
  equityPercent: string;
  skillTags: string;
  isFilled: boolean;
};

type NeedsFormProps = {
  value: EditableProjectNeed[];
  onChange: (nextValue: EditableProjectNeed[]) => void;
  error?: string;
};

const inputStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

function createNeedClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyEditableNeed(
  type: ProjectNeedType = "FINANCIAL"
): EditableProjectNeed {
  return {
    clientId: createNeedClientId(),
    type,
    title: "",
    description: "",
    amount: "",
    requiredCount: type === "SKILL" ? "1" : "",
    equityPercent: "",
    skillTags: "",
    isFilled: false,
  };
}

function updateNeedAt(
  needs: EditableProjectNeed[],
  index: number,
  updater: (need: EditableProjectNeed) => EditableProjectNeed
) {
  return needs.map((need, currentIndex) =>
    currentIndex === index ? updater(need) : need
  );
}

export function NeedsForm({ value, onChange, error }: NeedsFormProps) {
  const handleAddNeed = () => {
    onChange([...value, createEmptyEditableNeed("FINANCIAL")]);
  };

  const handleRemoveNeed = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleTypeChange = (index: number, nextTypeValue: string) => {
    const nextType = normalizeProjectNeedType(nextTypeValue);
    if (!nextType) return;

    onChange(
      updateNeedAt(value, index, (need) => ({
        ...need,
        type: nextType,
        amount: nextType === "FINANCIAL" ? need.amount : "",
        requiredCount:
          nextType === "SKILL"
            ? need.requiredCount || "1"
            : nextType === "FINANCIAL"
              ? need.requiredCount
              : "",
        equityPercent:
          nextType === "FINANCIAL" || nextType === "SKILL"
            ? need.equityPercent
            : "",
        skillTags: nextType === "SKILL" ? need.skillTags : "",
      }))
    );
  };

  const handleFieldChange = (
    index: number,
    field: keyof EditableProjectNeed,
    fieldValue: string | boolean
  ) => {
    onChange(
      updateNeedAt(value, index, (need) => ({
        ...need,
        [field]: fieldValue,
      }))
    );
  };

  return (
    <section className="dashboard-panel-soft rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Besoins du projet</h3>
          <p className="dashboard-faint mt-1 text-xs">
            Ajoutez les besoins financiers, compétences, matériel ou partenariats.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNeed}
          className="dashboard-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
        >
          + Ajouter un besoin
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-md border border-rose-300/60 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {value.length === 0 ? (
        <p className="dashboard-faint rounded-lg border border-dashed px-3 py-2 text-xs">
          Aucun besoin pour le moment. Utilisez &quot;+ Ajouter un besoin&quot;.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((need, index) => (
            <div key={need.clientId} className="dashboard-panel rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Besoin {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveNeed(index)}
                  className="rounded-md border border-rose-300/60 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-200"
                >
                  Supprimer
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="dashboard-faint inline-flex items-center gap-1.5">
                    Type
                    <FieldHelp text="Choisissez la nature du besoin: financier, compétence, matériel ou partenariat." />
                  </span>
                  <select
                    value={need.type}
                    onChange={(event) => handleTypeChange(index, event.target.value)}
                    className={inputStyles}
                  >
                    {PROJECT_NEED_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {PROJECT_NEED_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="dashboard-faint inline-flex items-center gap-1.5">
                    Titre
                    <FieldHelp text="Intitulé court du besoin pour le rendre identifiable rapidement." />
                  </span>
                  <input
                    value={need.title}
                    onChange={(event) =>
                      handleFieldChange(index, "title", event.target.value)
                    }
                    className={inputStyles}
                    placeholder={`Ex: ${PROJECT_NEED_TYPE_LABELS[need.type]} principal`}
                    maxLength={140}
                  />
                </label>
              </div>

              <div className="mt-3 space-y-3">
                {(need.type === "MATERIAL" || need.type === "PARTNERSHIP") && (
                  <label className="space-y-1 text-sm">
                    <span className="dashboard-faint inline-flex items-center gap-1.5">
                      Description
                      <FieldHelp text="Précisez le besoin attendu, le périmètre et les conditions." />
                    </span>
                    <textarea
                      value={need.description}
                      onChange={(event) =>
                        handleFieldChange(index, "description", event.target.value)
                      }
                      className={`${inputStyles} min-h-[84px]`}
                      placeholder="Décrivez précisément le besoin."
                    />
                  </label>
                )}

                {need.type === "FINANCIAL" && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Montant (FCFA)
                        <FieldHelp text="Montant recherché pour ce besoin financier." />
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={need.amount}
                        onChange={(event) =>
                          handleFieldChange(index, "amount", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="1000000"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Nb requis (optionnel)
                        <FieldHelp text="Nombre d'occurrences nécessaires pour ce besoin (par défaut 1)." />
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={need.requiredCount}
                        onChange={(event) =>
                          handleFieldChange(index, "requiredCount", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="1"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Equity % (optionnel)
                        <FieldHelp text="Pourcentage de parts proposé pour ce besoin. La somme totale des parts ne doit pas dépasser 100%." />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={need.equityPercent}
                        onChange={(event) =>
                          handleFieldChange(index, "equityPercent", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="10"
                      />
                    </label>
                  </div>
                )}

                {need.type === "SKILL" && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Nb de profils requis
                        <FieldHelp text="Nombre de personnes à recruter pour ce besoin de compétence." />
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={need.requiredCount}
                        onChange={(event) =>
                          handleFieldChange(index, "requiredCount", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="1"
                      />
                    </label>
                    <label className="space-y-1 text-sm md:col-span-2">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Compétences (recommandé)
                        <FieldHelp text="Listez les compétences attendues, séparées par des virgules." />
                      </span>
                      <input
                        value={need.skillTags}
                        onChange={(event) =>
                          handleFieldChange(index, "skillTags", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="Ex: comptabilité, vente terrain, logistique"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="dashboard-faint inline-flex items-center gap-1.5">
                        Equity % (optionnel)
                        <FieldHelp text="Pourcentage de parts proposé pour ce besoin de compétence." />
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={need.equityPercent}
                        onChange={(event) =>
                          handleFieldChange(index, "equityPercent", event.target.value)
                        }
                        className={inputStyles}
                        placeholder="5"
                      />
                    </label>
                  </div>
                )}

                <label className="dashboard-faint inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={need.isFilled}
                    onChange={(event) =>
                      handleFieldChange(index, "isFilled", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-400 bg-transparent text-accent focus:ring-accent/45"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    Besoin déjà comblé
                    <FieldHelp text="Cochez si ce besoin est déjà couvert afin d'ajuster la progression du projet." />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NeedsForm;
