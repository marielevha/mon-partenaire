import type { Metadata } from "next";
import { Container } from "@/components/landing/container";
import { Footer } from "@/components/landing/footer";
import { ContactForm } from "@/src/components/contact/ContactForm";
import { Header } from "@/components/landing/header";

export const metadata: Metadata = {
  title: "À propos | Mon partenaire",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="py-16">
        <Container className="max-w-4xl space-y-12">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Un projet au service des entrepreneurs</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">À propos</h1>
            <p className="text-base text-text-secondary">
              Mon partenaire est né du constat qu&apos;il manque des ressources claires et locales
              pour structurer des collaborations entrepreneuriales au Congo-Brazzaville.
              Notre ambition est de simplifier les échanges, clarifier les rôles et aider les
              porteurs de projets à avancer avec confiance.
            </p>
            <p className="text-base text-text-secondary">
              Nous proposons des modèles, des étapes pratiques et un accompagnement pédagogique
              pour transformer une idée en partenariat solide. Tout est conçu pour être simple,
              transparent et actionnable dès les premiers échanges.
            </p>
            <p className="text-base text-text-secondary">
              Vos retours sont essentiels pour améliorer la plateforme et prioriser les nouvelles
              fonctionnalités. N&apos;hésitez pas à nous écrire via le formulaire ci-dessous.
            </p>
          </div>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Contact</h2>
              <p className="text-base text-text-secondary">
                Laissez-nous un message. Nous vous répondons dès que possible.
              </p>
            </div>
            <ContactForm />
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
