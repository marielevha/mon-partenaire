"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email("Adresse email invalide."),
        password: z
          .string()
          .min(8, "Mot de passe trop court (8 caractères)."),
      }),
    []
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key] = issue.message;
        }
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setSuccess("Connexion validée. Vous allez être redirigé(e).");
    }, 700);
  };

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
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md space-y-5"
        >
          <label className="flex flex-col gap-2 text-sm text-text-primary">
            <span className="font-medium">Adresse email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="prenom@email.com"
              autoComplete="email"
              className={cn(inputStyles, errors.email && "border-rose-400")}
            />
            {errors.email ? (
              <span className="text-xs text-rose-500">{errors.email}</span>
            ) : null}
          </label>

          <PasswordField
            label="Mot de passe"
            name="password"
            value={password}
            onChange={setPassword}
            placeholder="Au moins 8 caractères"
            autoComplete="current-password"
            error={errors.password}
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

          {success ? (
            <div className="rounded-[calc(var(--radius)_-_8px)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {success}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>

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
