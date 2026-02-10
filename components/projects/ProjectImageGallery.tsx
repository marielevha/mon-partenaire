"use client";

import React, { useState } from "react";

interface Props {
  images: string[];
  title?: string;
}

export function ProjectImageGallery({ images, title }: Props) {
  const [mainIdx, setMainIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!images || images.length === 0) return null;

  const mainImage = images[mainIdx];
  const thumbnails = images.slice(0, 4);

  return (
    <div className="flex gap-4">
      {/* Hero image */}
      <div className="group relative flex-1 overflow-hidden rounded-xl border border-border/60 bg-surface shadow-lg">
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={mainImage}
            alt={title || "project"}
            onLoad={() => setIsLoading(false)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
          )}

          {/* Image counter badge - main badge */}
          <div className="absolute top-4 right-4 rounded-full bg-black/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white shadow-lg flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
              {mainIdx + 1}
            </span>
            <span className="text-white/80">/ {images.length}</span>
          </div>

          {/* Gallery indicator dots (subtle) */}
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === mainIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail grid - vertical */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2">
          {thumbnails.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setMainIdx(i)}
              className={`group relative h-28 w-28 overflow-hidden rounded-lg border-2 transition-all duration-300 flex-shrink-0 ${
                i === mainIdx
                  ? "border-accent shadow-accent/50 shadow-lg ring-2 ring-accent/50"
                  : "border-border/40 hover:border-accent/50"
              }`}
            >
              <img 
                src={src} 
                alt={`thumb ${i + 1}`} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Hover overlay */}
              {i !== mainIdx && (
                <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10" />
              )}
              {/* Index badge on thumbnail */}
              <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs font-semibold text-white">
                {i + 1}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectImageGallery;
