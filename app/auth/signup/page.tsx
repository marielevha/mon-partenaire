"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { signupAction } from "@/app/auth/actions";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const initialState = null;

type SignupState = typeof initialState | { ok: false; message: string };

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Création..." : "Créer mon compte"}
    </Button>
  );
};

export default function SignupPage() {
  const [state, formAction] = useFormState<SignupState, FormData>(
    signupAction,
    initialState
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title="Création de compte"
        description="Lancez votre aventure entrepreneuriale."
        sideTitle="Trouvez le bon coéquipier."
        sideDescription="La communauté Mon partenaire rassemble finance, compétences et énergie pour transformer une idée en entreprise."
        sideHighlights={[
          {
            title: "Profils vérifiés",
            description:
              "Un parcours de sélection qui met en avant l'engagement et la complémentarité.",
          },
          {
            title: "Objectifs partagés",
            description:
              "Construisez une équipe alignée sur vos valeurs et vos délais.",
          },
          {
            title: "Accompagnement clair",
            description:
              "Des ressources pour structurer, financer et lancer votre société.",
          },
        ]}
      >
        <form action={formAction} className="mx-auto w-full max-w-md space-y-5">
          <label className="flex flex-col gap-2 text-sm text-text-primary">
            <span className="font-medium">Prénom</span>
            <input
              type="text"
              name="name"
              placeholder="Camille"
              autoComplete="given-name"
              className={cn(inputStyles)}
              required
            />
          </label>

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
            autoComplete="new-password"
            required
          />

          <p className="text-xs text-text-secondary">
            En créant un compte, vous acceptez nos Conditions d'utilisation et
            notre Politique de confidentialité.
          </p>

          {state?.ok === false ? (
            <div className="rounded-[calc(var(--radius)_-_8px)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {state.message}
            </div>
          ) : null}

          <SubmitButton />

          <AuthLinks
            text="Déjà un compte ?"
            linkText="Se connecter"
            href="/auth/login"
          />
        </form>
      </AuthCard>
    </main>
  );
}
