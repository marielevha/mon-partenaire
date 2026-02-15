import { Container } from "@/components/landing/container";
import { Section } from "@/components/landing/section";
import { TestimonialsCarousel } from "@/components/landing/testimonials-carousel";
import { getI18n } from "@/src/i18n";

export async function Testimonials() {
  const messages = await getI18n();
  const t = messages.landing.testimonials;

  return (
    <Section id="temoignages" className="bg-surface-accent/65">
      <Container>
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">{t.title}</h2>
          <p className="mt-4 text-sm text-text-secondary">{t.description}</p>
        </div>

        <TestimonialsCarousel
          items={t.items}
          prevLabel={t.prevLabel}
          nextLabel={t.nextLabel}
        />
      </Container>
    </Section>
  );
}

export default Testimonials;
