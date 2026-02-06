"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { loginAction } from "@/app/auth/actions";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const initialState = null;

type LoginState = typeof initialState | { ok: false; message: string };

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Connexion..." : "Se connecter"}
    </Button>
  );
};

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(
    loginAction,
    initialState
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title="Connexion"
        description="Retrouvez votre espace partenaire."
        sideTitle="Bougez vite, créez bien."
        sideDescription="Connectez-vous pour matcher avec les bons profils et accélérer la création de votre projet."
        sideHighlights={[
          {
            title: "Matchs qualifiés",
            description:
              "Des partenaires financiers et techniques déjà sensibilisés à votre vision.",
          },
          {
            title: "Parcours clair",
            description:
              "Des étapes simples pour passer d'une idée à une structure légale.",
          },
          {
            title: "Communauté engagée",
            description:
              "Des échanges rapides, centrés sur l'action et la confiance.",
          },
        ]}
      >
        <form action={formAction} className="mx-auto w-full max-w-md space-y-5">
          <label className="flex flex-col gap-2 text-sm text-text-primary">
            <span className="font-medium">Adresse email</span>
            <input
              type="email"
              name="email"
              placeholder="prenom@email.com"
              autoComplete="email"
              className={cn(inputStyles)}
              required
            />
          </label>

          <PasswordField
            label="Mot de passe"
            name="password"
            placeholder="Au moins 8 caractères"
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between text-sm text-text-secondary">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-accent transition-colors hover:text-accent-strong"
            >
              Mot de passe oublié ?
            </Link>
            <span className="text-xs">Support 7j/7</span>
          </div>

          {state?.ok === false ? (
            <div className="rounded-[calc(var(--radius)_-_8px)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {state.message}
            </div>
          ) : null}

          <SubmitButton />

          <AuthLinks
            text="Pas encore de compte ?"
            linkText="Créer un compte"
            href="/auth/signup"
          />
        </form>
      </AuthCard>
    </main>
  );
}
