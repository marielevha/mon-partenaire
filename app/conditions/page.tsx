import type { Metadata } from "next";
import { Container } from "@/components/landing/container";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Conditions générales | Mon partenaire",
};

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="py-16">
        <Container className="max-w-3xl space-y-10">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Dernière mise à jour : 10 mars 2025</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Conditions générales d&apos;utilisation
            </h1>
            <p className="text-base text-text-secondary">
              Ces conditions définissent les règles d&apos;accès et d&apos;utilisation du service
              Mon partenaire. En utilisant la plateforme, vous acceptez les termes
              ci-dessous.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Objet</h2>
            <p className="text-base text-text-secondary">
              Mon partenaire propose des ressources pour structurer des partenariats
              entrepreneuriaux. Les contenus fournis sont informatifs et ne constituent pas
              un conseil juridique.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Accès au service</h2>
            <p className="text-base text-text-secondary">
              L&apos;accès peut être limité ou suspendu pour maintenance ou en cas de problème
              technique. Nous mettons tout en œuvre pour assurer une disponibilité
              raisonnable du service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Responsabilités et limites</h2>
            <p className="text-base text-text-secondary">
              Les informations présentées sont indicatives et doivent être adaptées à votre
              situation. Vous restez responsable des décisions prises à partir des contenus
              disponibles sur la plateforme.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
            <p className="text-base text-text-secondary">
              Les textes, visuels, marques et contenus présents sur Mon partenaire sont
              protégés. Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Liens externes et affiliation</h2>
            <p className="text-base text-text-secondary">
              Des liens externes peuvent être proposés pour faciliter vos démarches. Nous ne
              contrôlons pas ces sites et ne pouvons pas être tenus responsables de leurs
              contenus ou pratiques.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Modification des conditions</h2>
            <p className="text-base text-text-secondary">
              Nous pouvons mettre à jour les conditions à tout moment. Les nouvelles
              versions s&apos;appliquent dès leur publication sur cette page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Droit applicable</h2>
            <p className="text-base text-text-secondary">
              Les présentes conditions sont régies par le droit applicable au Congo-Brazzaville.
              En cas de litige, une solution amiable sera recherchée en priorité.
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
