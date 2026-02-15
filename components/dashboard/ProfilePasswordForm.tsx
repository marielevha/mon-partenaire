"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateDashboardPasswordAction,
  type PasswordUpdateState,
} from "@/app/dashboard/profile/actions";

const initialState: PasswordUpdateState = null;
const inputStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="dashboard-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 animate-spin" fill="none">
            <circle cx="10" cy="10" r="7" className="opacity-25" stroke="currentColor" strokeWidth="2" />
            <path d="M17 10a7 7 0 0 0-7-7" className="opacity-90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Mise à jour...
        </>
      ) : (
        "Mettre à jour le mot de passe"
      )}
    </button>
  );
}

export function ProfilePasswordForm() {
  const [state, formAction] = useActionState(updateDashboardPasswordAction, initialState);
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5">
      {state?.ok === true ? (
        <div className="rounded-lg border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
          {state.message}
        </div>
      ) : null}
      {state?.ok === false ? (
        <div className="rounded-lg border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <label className="flex flex-col gap-2.5 text-sm">
        <span className="dashboard-faint">Mot de passe actuel</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          className={inputStyles}
          required
        />
        {fieldErrors?.currentPassword ? (
          <p className="text-xs text-rose-500">{fieldErrors.currentPassword}</p>
        ) : null}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2.5 text-sm">
          <span className="dashboard-faint">Nouveau mot de passe</span>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className={inputStyles}
            required
          />
          {fieldErrors?.newPassword ? (
            <p className="text-xs text-rose-500">{fieldErrors.newPassword}</p>
          ) : (
            <p className="dashboard-faint text-xs">
              Minimum 8 caractères, avec au moins une lettre et un chiffre.
            </p>
          )}
        </label>

        <label className="flex flex-col gap-2.5 text-sm">
          <span className="dashboard-faint">Confirmer</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputStyles}
            required
          />
          {fieldErrors?.confirmPassword ? (
            <p className="text-xs text-rose-500">{fieldErrors.confirmPassword}</p>
          ) : null}
        </label>
      </div>

      <div className="dashboard-panel-soft flex items-center justify-between rounded-xl px-4 py-3">
        <p className="dashboard-faint text-xs">
          Après modification, utilisez le nouveau mot de passe lors de la prochaine connexion.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

export default ProfilePasswordForm;
