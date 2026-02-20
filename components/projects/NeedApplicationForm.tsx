"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  submitNeedApplicationAction,
  type NeedApplicationState,
} from "@/app/projects/[id]/actions";

type NeedApplicationFormProps = {
  projectId: string;
  projectNeedId: string;
  needType: string;
  needTitle: string;
  ownerDefinedEquityPercent: number | null;
  ownerDefinedRequiredCount: number | null;
  isNeedFilled: boolean;
  isAuthenticated: boolean;
  isProjectOwner: boolean;
  existingStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
};

const initialState: NeedApplicationState = null;

function statusBadge(status?: NeedApplicationFormProps["existingStatus"]) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200">
        Candidature en attente
      </span>
    );
  }
  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200">
        Candidature acceptée
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-200">
        Dernière candidature refusée
      </span>
    );
  }
  if (status === "WITHDRAWN") {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-200">
        Candidature retirée
      </span>
    );
  }
  return null;
}

export function NeedApplicationForm({
  projectId,
  projectNeedId,
  needType,
  needTitle,
  ownerDefinedEquityPercent,
  ownerDefinedRequiredCount,
  isNeedFilled,
  isAuthenticated,
  isProjectOwner,
  existingStatus,
}: NeedApplicationFormProps) {
  const [state, action] = useActionState(submitNeedApplicationAction, initialState);
  const [expanded, setExpanded] = useState(false);

  const cannotApplyReason = useMemo(() => {
    if (isNeedFilled) return "Ce besoin est déjà comblé.";
    if (isProjectOwner) return "Vous êtes propriétaire de ce projet.";
    if (!isAuthenticated) return "Connectez-vous pour candidater.";
    if (existingStatus === "PENDING") return "Une candidature est déjà en attente.";
    if (existingStatus === "ACCEPTED") return "Vous avez déjà été accepté sur ce besoin.";
    return null;
  }, [existingStatus, isAuthenticated, isNeedFilled, isProjectOwner]);

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border/40 bg-background/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Candidature
        </p>
        {statusBadge(existingStatus)}
      </div>

      {!isAuthenticated ? (
        <p className="text-xs text-text-secondary">
          <Link href="/auth/login" className="font-medium text-accent hover:underline">
            Connectez-vous
          </Link>{" "}
          pour candidater à ce besoin.
        </p>
      ) : null}

      {cannotApplyReason ? (
        <p className="text-xs text-text-secondary">{cannotApplyReason}</p>
      ) : (
        <div className="space-y-3">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="dashboard-btn-primary inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              Candidater
            </button>
          ) : (
            <form action={action} className="space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="projectNeedId" value={projectNeedId} />
              <input type="hidden" name="needType" value={needType} />

              {needType === "FINANCIAL" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="block text-xs text-text-secondary">Montant proposé (FCFA)</span>
                    <input
                      name="proposedAmount"
                      type="number"
                      min={1}
                      required
                      className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-text-secondary">Part proposée (%)</span>
                    <input
                      name="proposedEquityPercent"
                      type="number"
                      min={0}
                      max={100}
                      value={ownerDefinedEquityPercent ?? ""}
                      readOnly
                      className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    />
                  </label>
                </div>
              ) : null}

              {needType === "SKILL" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="block text-xs text-text-secondary">Profils proposés</span>
                    <input
                      name="proposedRequiredCount"
                      type="number"
                      min={1}
                      required
                      value={ownerDefinedRequiredCount ?? 1}
                      readOnly
                      className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-text-secondary">Part proposée (%)</span>
                    <input
                      name="proposedEquityPercent"
                      type="number"
                      min={0}
                      max={100}
                      value={ownerDefinedEquityPercent ?? ""}
                      readOnly
                      className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="block text-xs text-text-secondary">
                      Compétences (séparées par virgule)
                    </span>
                    <input
                      name="proposedSkillTags"
                      placeholder="marketing, vente, finance"
                      className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                    />
                  </label>
                </div>
              ) : null}

              <label className="space-y-1">
                <span className="block text-xs text-text-secondary">
                  Message{needType === "MATERIAL" || needType === "PARTNERSHIP" ? " (obligatoire)" : ""}
                </span>
                <textarea
                  name="message"
                  required={needType === "MATERIAL" || needType === "PARTNERSHIP"}
                  rows={3}
                  placeholder={`Expliquez votre proposition pour "${needTitle}"`}
                  className="dashboard-input w-full rounded-md px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                />
              </label>

              {state?.ok === false ? (
                <p className="text-xs text-rose-500">{state.message}</p>
              ) : null}
              {state?.ok === true ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-300">{state.message}</p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="dashboard-btn-primary inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Envoyer
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="dashboard-btn-secondary inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default NeedApplicationForm;
