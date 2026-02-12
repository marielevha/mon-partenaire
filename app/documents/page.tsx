import type { Metadata } from "next";
import { getSessionAction } from "@/app/auth/actions";
import { DocumentsLibrary } from "@/components/documents/DocumentsLibrary";
import { Container } from "@/components/landing/container";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { getDocumentTemplatesForLibrary } from "@/src/lib/document-templates.server";

export const metadata: Metadata = {
  title: "Documents | Mon partenaire",
  description:
    "Bibliotheque de modeles concrets pour business plan, documents juridiques et preparation de financement.",
};

const suggestionCards = [
  {
    title: "Pack pitch investisseur",
    detail: "Slides de pitch, one-pager et checklist data room.",
  },
  {
    title: "Plan de recrutement",
    detail: "Modele de fiches de poste et planning de recrutement.",
  },
  {
    title: "Pack conformite RH",
    detail: "Contrat de travail, reglement interieur et suivi presence.",
  },
  {
    title: "Plan de croissance commerciale",
    detail: "Template de pipeline ventes et objectifs mensuels.",
  },
];

export default async function DocumentsPage() {
  const session = await getSessionAction();
  const isAuthenticated = Boolean(session?.user?.id);
  const templates = await getDocumentTemplatesForLibrary();
  const totalTemplates = templates.length;
  const congoFocusedTemplates = templates.filter(
    (template) => template.category === "Secteurs congolais"
  ).length;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="py-16">
        <Container className="max-w-6xl space-y-12">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Bibliotheque de modeles</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Documents et modeles prets a l&apos;emploi
            </h1>
            <p className="text-base text-text-secondary">
              Explorez des modeles pratiques pour structurer votre projet: business plan,
              documents juridiques, financement et templates metiers adaptes au contexte
              congolais.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">Modeles disponibles</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{totalTemplates}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">Modeles secteurs congolais</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {congoFocusedTemplates}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">Mode interactif</p>
              <p className="mt-2 text-sm text-text-primary">
                {isAuthenticated
                  ? "Actif: vous pouvez utiliser les modeles depuis votre dashboard."
                  : "Connectez-vous pour transformer un modele en brouillon de projet."}
              </p>
            </div>
          </div>

          <DocumentsLibrary isAuthenticated={isAuthenticated} templates={templates} />

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-text-primary">
              Suggestions de modeles a ajouter ensuite
            </h2>
            <p className="text-sm text-text-secondary">
              Ces packs peuvent renforcer la valeur de la plateforme pour entrepreneurs et
              investisseurs.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestionCards.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
