"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

interface Props {
  images: string[];
  title?: string;
}

export function ProjectImageGallery({ images, title }: Props) {
  const [mainIdx, setMainIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);

  if (safeImages.length === 0) return null;

  const goToIndex = (index: number) => {
    setIsLoading(true);
    setMainIdx(index);
  };

  const goPrev = () => {
    const next = (mainIdx - 1 + safeImages.length) % safeImages.length;
    goToIndex(next);
  };

  const goNext = () => {
    const next = (mainIdx + 1) % safeImages.length;
    goToIndex(next);
  };

  const mainImage = safeImages[mainIdx];
  const thumbnails = safeImages.slice(0, 6);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      <div className="group relative flex-1 overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={mainImage}
            alt={title ? `${title} - image ${mainIdx + 1}` : `Image ${mainIdx + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onLoad={() => setIsLoading(false)}
            priority={mainIdx === 0}
          />

          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          ) : null}

          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Image précédente"
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Image suivante"
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
              >
                →
              </button>
            </>
          ) : null}

          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {mainIdx + 1}
            </span>
            <span className="text-white/80">/ {safeImages.length}</span>
          </div>

          {safeImages.length > 1 ? (
            <div className="absolute bottom-3 left-4 flex gap-1.5">
              {safeImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => goToIndex(index)}
                  aria-label={`Voir image ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === mainIdx ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/65"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {safeImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {thumbnails.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => goToIndex(index)}
              aria-label={`Sélectionner image ${index + 1}`}
              className={`group relative h-24 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 sm:h-28 sm:w-32 ${
                index === mainIdx
                  ? "border-accent shadow-lg shadow-accent/30 ring-2 ring-accent/35"
                  : "border-border/40 hover:border-accent/50"
              }`}
            >
              <Image
                src={src}
                alt={title ? `${title} miniature ${index + 1}` : `Miniature ${index + 1}`}
                fill
                sizes="128px"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] font-semibold text-white">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ProjectImageGallery;
