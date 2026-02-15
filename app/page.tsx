import { Audience } from "@/components/landing/audience";
import { CtaFinal } from "@/components/landing/cta-final";
import { Examples } from "@/components/landing/examples";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Steps } from "@/components/landing/steps";
import { Testimonials } from "@/components/landing/testimonials";
import { Trust } from "@/components/landing/trust";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[-80px] -z-10 h-[560px] bg-[url('/landing/hero-photo.svg')] bg-top bg-no-repeat opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-[-120px] -z-10 h-[520px] bg-[url('/landing/bg-orb-1.svg')] bg-top bg-no-repeat opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-[-120px] -z-10 h-[520px] bg-[url('/landing/bg-orb-2.svg')] bg-bottom bg-no-repeat opacity-70"
      />
      <Header />
      <main>
        <Hero />
        <Steps />
        <Audience />
        <Examples />
        <Testimonials />
        <Trust />
        <CtaFinal />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
