"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateDashboardProfileAction,
  type ProfileUpdateState,
} from "@/app/dashboard/profile/actions";

const initialState: ProfileUpdateState = null;
const inputStyles =
  "dashboard-input w-full rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45";

type ProfileSettingsFormProps = {
  initialValues: {
    fullName: string;
    phone: string;
    avatarUrl: string;
    email: string;
  };
};

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
          Enregistrement...
        </>
      ) : (
        "Enregistrer les modifications"
      )}
    </button>
  );
}

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const [state, formAction] = useActionState(updateDashboardProfileAction, initialState);
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [avatarUrl, setAvatarUrl] = useState(initialValues.avatarUrl);

  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  const initials = useMemo(() => {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return "MP";
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }, [fullName]);

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

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <label className="space-y-1 text-sm">
            <span className="dashboard-faint">Nom complet</span>
            <input
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputStyles}
              maxLength={120}
              required
            />
            {fieldErrors?.fullName ? (
              <p className="text-xs text-rose-500">{fieldErrors.fullName}</p>
            ) : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="dashboard-faint">Téléphone</span>
            <input
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputStyles}
              maxLength={30}
              placeholder="+242 06 123 45 67"
            />
            {fieldErrors?.phone ? (
              <p className="text-xs text-rose-500">{fieldErrors.phone}</p>
            ) : null}
          </label>

          <label className="space-y-1 text-sm">
            <span className="dashboard-faint">URL avatar</span>
            <input
              name="avatarUrl"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className={inputStyles}
              placeholder="https://..."
            />
            {fieldErrors?.avatarUrl ? (
              <p className="text-xs text-rose-500">{fieldErrors.avatarUrl}</p>
            ) : (
              <p className="dashboard-faint text-xs">
                Optionnel. Collez une URL publique (http/https) pour personnaliser votre avatar.
              </p>
            )}
          </label>
        </div>

        <div className="dashboard-panel-soft rounded-xl border border-border/70 p-4">
          <p className="dashboard-faint text-xs uppercase tracking-[0.18em]">Aperçu</p>
          <div className="mt-4 flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar utilisateur"
                className="h-14 w-14 rounded-full border border-border object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{fullName || "Nom complet"}</p>
              <p className="dashboard-faint truncate text-xs">{initialValues.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel-soft flex items-center justify-between rounded-xl px-4 py-3">
        <p className="dashboard-faint text-xs">
          Les changements sont appliqués à votre compte et au menu dashboard.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

export default ProfileSettingsForm;
