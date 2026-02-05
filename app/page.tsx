import { Audience } from "@/components/landing/audience";
import { CtaFinal } from "@/components/landing/cta-final";
import { Examples } from "@/components/landing/examples";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Steps } from "@/components/landing/steps";
import { Trust } from "@/components/landing/trust";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main>
        <Hero />
        <Steps />
        <Audience />
        <Examples />
        <Trust />
        <CtaFinal />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
