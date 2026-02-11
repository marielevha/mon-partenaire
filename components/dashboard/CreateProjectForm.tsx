"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { CreateProjectState } from "@/app/dashboard/actions";
import { createProjectAction } from "@/app/dashboard/actions";
import { cn } from "@/components/ui/utils";

const initialState: CreateProjectState = null;

const inputStyles =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
    >
      {pending ? "Création..." : "Créer le projet"}
    </button>
  );
}

export function CreateProjectForm() {
  const [state, formAction] = useActionState(createProjectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Titre</span>
          <input
            name="title"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.title && "border-rose-400")}
            placeholder="Ex: Usine de transformation locale"
            required
          />
          {state?.ok === false && state.fieldErrors?.title ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.title}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Ville</span>
          <input
            name="city"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.city && "border-rose-400")}
            placeholder="Brazzaville"
            required
          />
          {state?.ok === false && state.fieldErrors?.city ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.city}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="text-text-secondary">Résumé</span>
        <textarea
          name="summary"
          className={cn(inputStyles, "min-h-[84px]", state?.ok === false && state.fieldErrors?.summary && "border-rose-400")}
          placeholder="Décrivez le positionnement du projet en quelques lignes."
          required
        />
        {state?.ok === false && state.fieldErrors?.summary ? (
          <p className="text-xs text-rose-600">{state.fieldErrors.summary}</p>
        ) : null}
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-text-secondary">Description complète</span>
        <textarea
          name="description"
          className={cn(inputStyles, "min-h-[150px]", state?.ok === false && state.fieldErrors?.description && "border-rose-400")}
          placeholder="Objectif, marché, modèle économique, équipe, jalons..."
          required
        />
        {state?.ok === false && state.fieldErrors?.description ? (
          <p className="text-xs text-rose-600">{state.fieldErrors.description}</p>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Catégorie</span>
          <select
            name="category"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.category && "border-rose-400")}
            defaultValue="TECH"
          >
            <option value="AGRIBUSINESS">Agribusiness</option>
            <option value="TECH">Tech</option>
            <option value="HEALTH">Santé</option>
            <option value="EDUCATION">Éducation</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Autre</option>
          </select>
          {state?.ok === false && state.fieldErrors?.category ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.category}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Modèle</span>
          <select
            name="equityModel"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.equityModel && "border-rose-400")}
            defaultValue="EQUITY"
          >
            <option value="NONE">Sans equity</option>
            <option value="EQUITY">Part en capital</option>
            <option value="REVENUE_SHARE">Partage de revenus</option>
          </select>
          {state?.ok === false && state.fieldErrors?.equityModel ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.equityModel}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Visibilité</span>
          <select
            name="visibility"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.visibility && "border-rose-400")}
            defaultValue="PUBLIC"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Privé</option>
          </select>
          {state?.ok === false && state.fieldErrors?.visibility ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.visibility}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Forme légale</span>
          <select name="legalForm" className={inputStyles} defaultValue="">
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
          <span className="text-text-secondary">Capital total recherché (FCFA)</span>
          <input
            name="totalCapital"
            type="number"
            min="0"
            step="1000"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.totalCapital && "border-rose-400")}
            placeholder="12000000"
          />
          {state?.ok === false && state.fieldErrors?.totalCapital ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.totalCapital}</p>
          ) : null}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Apport du porteur (FCFA)</span>
          <input
            name="ownerContribution"
            type="number"
            min="0"
            step="1000"
            className={cn(inputStyles, state?.ok === false && state.fieldErrors?.ownerContribution && "border-rose-400")}
            placeholder="3000000"
          />
          {state?.ok === false && state.fieldErrors?.ownerContribution ? (
            <p className="text-xs text-rose-600">{state.fieldErrors.ownerContribution}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="text-text-secondary">Note sur le partenariat (optionnel)</span>
        <textarea
          name="equityNote"
          className={cn(inputStyles, "min-h-[90px]")}
          placeholder="Ex: Ouvert à une gouvernance partagée et à un pacte d'associés progressif."
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-surface-accent/60 px-4 py-3">
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="companyCreated" className="h-4 w-4" />
          Entreprise déjà créée
        </label>

        <input type="hidden" name="country" value="CG" />

        <div className="flex items-center gap-2">
          {state?.ok ? (
            <Link
              href={`/projects/${state.projectId}`}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface"
            >
              Voir le projet
            </Link>
          ) : null}
          <SubmitButton />
        </div>
      </div>

      {state?.ok === false ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default CreateProjectForm;
