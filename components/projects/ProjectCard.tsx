"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "./ProjectBadge";
import { projectNeedTypeLabel } from "@/src/lib/project-needs";

interface Props {
  id: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  totalCapital?: number | null;
  remainingNeeds: number;
  needTypes: string[];
  image?: string | null;
  progress?: number | null; // 0-100
}

const FALLBACK_IMAGES = ["/landing/project-1.svg", "/landing/project-2.svg", "/landing/project-3.svg"];

export function ProjectCard({ id, title, summary, category, city, totalCapital, remainingNeeds, needTypes, image = '/landing/project-1.svg', progress = null }: Props) {
  const computedProgress = typeof progress === 'number' ? progress : (remainingNeeds === 0 ? 100 : Math.max(8, 100 - remainingNeeds * 22));
  const fallbackImage = useMemo(
    () => FALLBACK_IMAGES[Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % FALLBACK_IMAGES.length],
    [id]
  );
  const [failedSources, setFailedSources] = useState<Record<string, true>>({});
  const normalizedImage = image && image.trim().length > 0 ? image : fallbackImage;
  const displayImage = failedSources[normalizedImage] ? fallbackImage : normalizedImage;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-border/60 bg-surface/90 p-0 shadow-medium transition-all duration-200 hover:shadow-md hover:border-accent/50">
      <Link href={`/projects/${id}`} className="group relative block h-44 w-full overflow-hidden">
        <Image
          src={displayImage}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => {
            if (normalizedImage !== fallbackImage) {
              setFailedSources((previous) =>
                previous[normalizedImage]
                  ? previous
                  : { ...previous, [normalizedImage]: true }
              );
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

        {/* Overlay badge: Ouvert / Fermé */}
        <div className="absolute right-3 top-3 z-10">
          {computedProgress >= 100 ? (
            <span className="inline-flex items-center rounded-full bg-red-600/90 px-2.5 py-0.5 text-xs font-medium text-white">Fermé</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-green-600/90 px-2.5 py-0.5 text-xs font-medium text-white">Ouvert</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="mb-1">
          <ProjectBadge>{category}</ProjectBadge>
        </div>

        <div className="flex-1 space-y-2">
          <Link href={`/projects/${id}`} className="inline-block hover:opacity-80 transition-opacity">
            <h3 className="text-lg font-semibold text-text-primary line-clamp-2">{title}</h3>
          </Link>
          <p className="text-sm text-text-secondary line-clamp-2">{summary}</p>
        </div>

        <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-secondary">{city}</div>
            {totalCapital ? (
              <div className="text-sm font-medium text-accent">{totalCapital.toLocaleString()} FCFA</div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {needTypes.map((needType) => (
              <ProjectBadge key={`${id}-${needType}`}>
                {projectNeedTypeLabel(needType)}
              </ProjectBadge>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-text-secondary">{remainingNeeds} besoin(s)</div>
              <div className="text-xs font-medium text-text-secondary">{computedProgress}%</div>
            </div>
            <div className="h-2 w-full rounded-full bg-border/40">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${computedProgress}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Link href={`/projects/${id}`} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong">Voir</Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ProjectCard;
