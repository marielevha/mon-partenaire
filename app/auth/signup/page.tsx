"use client";

import { useFormStatus } from "react-dom";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { SignupForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";

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
        <SignupForm />
        <div className="mt-5">
          <AuthLinks
            text="Déjà un compte ?"
            linkText="Se connecter"
            href="/auth/login"
          />
        </div>
      </AuthCard>
    </main>
  );
}
