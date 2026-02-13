import type { Metadata } from "next";
import { getSessionAction } from "@/app/auth/actions";
import { DocumentsLibrary } from "@/components/documents/DocumentsLibrary";
import { Container } from "@/components/landing/container";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { getDocumentTemplatesForLibrary } from "@/src/lib/document-templates.server";
import { getCurrentLocale, getI18n } from "@/src/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const messages = await getI18n(locale);

  return {
    title: `${messages.documents.page.title} | ${messages.header.brandName}`,
    description: messages.documents.page.description,
  };
}

export default async function DocumentsPage() {
  const messages = await getI18n();
  const documentsPageMessages = messages.documents.page;
  const libraryMessages = messages.documents.library;

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
            <p className="text-sm text-text-secondary">{documentsPageMessages.eyebrow}</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {documentsPageMessages.title}
            </h1>
            <p className="text-base text-text-secondary">
              {documentsPageMessages.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">
                {documentsPageMessages.statsAvailable}
              </p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{totalTemplates}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">{documentsPageMessages.statsCongo}</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {congoFocusedTemplates}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <p className="text-sm text-text-secondary">
                {documentsPageMessages.statsInteractive}
              </p>
              <p className="mt-2 text-sm text-text-primary">
                {isAuthenticated
                  ? documentsPageMessages.interactiveEnabled
                  : documentsPageMessages.interactiveDisabled}
              </p>
            </div>
          </div>

          <DocumentsLibrary
            isAuthenticated={isAuthenticated}
            templates={templates}
            labels={libraryMessages}
          />

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-text-primary">
              {documentsPageMessages.suggestionsTitle}
            </h2>
            <p className="text-sm text-text-secondary">
              {documentsPageMessages.suggestionsDescription}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {documentsPageMessages.suggestions.map((item) => (
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
