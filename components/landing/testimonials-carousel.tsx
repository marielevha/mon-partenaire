"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

type TestimonialItem = {
  name: string;
  role: string;
  quote: string;
  project: string;
  city: string;
  rating: number;
};

type TestimonialsCarouselProps = {
  items: TestimonialItem[];
  prevLabel: string;
  nextLabel: string;
};

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }).map((_, index) => (
    <span
      key={`star-${index}`}
      aria-hidden="true"
      className={index < safeRating ? "text-amber-400" : "text-border"}
    >
      ★
    </span>
  ));
}

export function TestimonialsCarousel({
  items,
  prevLabel,
  nextLabel,
}: TestimonialsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return undefined;

    const updateControls = () => {
      const { scrollLeft, scrollWidth, clientWidth } = node;
      setCanPrev(scrollLeft > 4);
      setCanNext(scrollLeft + clientWidth < scrollWidth - 4);
    };

    updateControls();
    node.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      node.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, []);

  const scrollByDirection = (direction: "prev" | "next") => {
    const node = trackRef.current;
    if (!node) return;

    const delta = Math.max(node.clientWidth * 0.9, 280);
    node.scrollBy({
      left: direction === "next" ? delta : -delta,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByDirection("prev")}
          disabled={!canPrev}
          aria-label={prevLabel}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition-colors",
            canPrev
              ? "hover:border-accent/50 hover:text-accent"
              : "cursor-not-allowed opacity-45"
          )}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          onClick={() => scrollByDirection("next")}
          disabled={!canNext}
          aria-label={nextLabel}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition-colors",
            canNext
              ? "hover:border-accent/50 hover:text-accent"
              : "cursor-not-allowed opacity-45"
          )}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <Card
            key={`${item.name}-${item.project}`}
            className="min-w-[88%] snap-start border-border/60 bg-surface/85 sm:min-w-[68%] lg:min-w-[48%] xl:min-w-[36%]"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">{item.name}</p>
              <div className="text-sm" aria-label={`${item.rating}/5`}>
                {renderStars(item.rating)}
              </div>
            </div>

            <p className="text-sm italic text-text-secondary">“{item.quote}”</p>

            <div className="mt-5 border-t border-border/60 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {item.role}
              </p>
              <p className="mt-1 text-sm text-text-primary">{item.project}</p>
              <p className="text-xs text-text-secondary">{item.city}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TestimonialsCarousel;
