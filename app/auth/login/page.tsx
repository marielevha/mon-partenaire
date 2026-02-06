"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthLinks } from "@/components/auth/auth-links";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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
        <LoginForm />
        <div className="mt-5">
          <AuthLinks
            text="Pas encore de compte ?"
            linkText="Créer un compte"
            href="/auth/signup"
          />
        </div>
      </AuthCard>
    </main>
  );
}

