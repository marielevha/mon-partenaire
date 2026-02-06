"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, "Indiquez votre prénom."),
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
    const result = schema.safeParse({ name, email, password });
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
      setSuccess("Compte prêt. Redirection vers l'onboarding.");
    }, 700);
  };

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
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md space-y-5"
        >
          <label className="flex flex-col gap-2 text-sm text-text-primary">
            <span className="font-medium">Prénom</span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Camille"
              autoComplete="given-name"
              className={cn(inputStyles, errors.name && "border-rose-400")}
            />
            {errors.name ? (
              <span className="text-xs text-rose-500">{errors.name}</span>
            ) : null}
          </label>

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
            autoComplete="new-password"
            error={errors.password}
          />

          <p className="text-xs text-text-secondary">
            En créant un compte, vous acceptez nos Conditions d'utilisation et
            notre Politique de confidentialité.
          </p>

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
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </Button>

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
