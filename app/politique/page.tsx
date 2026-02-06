import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/landing/container";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Mon partenaire",
};

export default function PolitiquePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main className="py-16">
        <Container className="max-w-3xl space-y-10">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Dernière mise à jour : 10 mars 2025</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Politique de confidentialité
            </h1>
            <p className="text-base text-text-secondary">
              Nous collectons uniquement les informations nécessaires pour répondre à vos
              demandes et améliorer le service. Cette politique explique, de façon simple,
              comment vos données sont utilisées.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Données collectées</h2>
            <p className="text-base text-text-secondary">
              Lorsque vous utilisez le formulaire de contact, nous recueillons votre nom,
              votre email, votre sujet et votre message. Des données de mesure d&apos;audience
              peuvent être collectées si des outils d&apos;analytics sont activés.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Finalités</h2>
            <p className="text-base text-text-secondary">
              Les données servent à répondre à vos demandes, assurer le suivi des échanges
              et améliorer la qualité du service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Base légale</h2>
            <p className="text-base text-text-secondary">
              Le traitement des messages repose sur votre consentement et sur l&apos;intérêt
              légitime de fournir un service de qualité.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Durées de conservation</h2>
            <p className="text-base text-text-secondary">
              Les messages de contact sont conservés pendant 12 mois à compter de la
              dernière interaction, puis supprimés.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Partage des données</h2>
            <p className="text-base text-text-secondary">
              Nous ne partageons pas vos informations avec des tiers, sauf si un prestataire
              technique intervient pour l&apos;hébergement ou la maintenance du service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Vos droits</h2>
            <p className="text-base text-text-secondary">
              Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos
              données. Pour exercer vos droits, utilisez le formulaire disponible sur la
              page <Link className="text-accent underline" href="/a-propos">À propos</Link>.
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
