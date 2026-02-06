"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email("Adresse email invalide."),
      }),
    []
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const result = schema.safeParse({ email });
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
      setSuccess("Email de réinitialisation envoyé (démo).");
    }, 700);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthCard
        title="Réinitialisation"
        description="Recevez un lien pour créer un nouveau mot de passe."
        sideTitle="On garde votre élan."
        sideDescription="Même si vous oubliez votre mot de passe, votre projet reste sur les rails."
        sideHighlights={[
          {
            title: "Sécurité renforcée",
            description:
              "Chaque demande est confirmée via votre adresse email.",
          },
          {
            title: "Temps gagné",
            description:
              "Un lien unique pour reprendre votre session en quelques minutes.",
          },
          {
            title: "Support humain",
            description:
              "Besoin d'aide ? Notre équipe vous répond en priorité.",
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
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </Button>

          <AuthLinks
            text="Vous avez retrouvé votre mot de passe ?"
            linkText="Se connecter"
            href="/auth/login"
          />
        </form>
      </AuthCard>
    </main>
  );
}
