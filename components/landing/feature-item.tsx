import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

interface FeatureItemProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function FeatureItem({
  title,
  description,
  icon,
  className,
}: FeatureItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-[var(--radius)] border border-border/60 bg-surface/70 p-4 shadow-soft",
        className
      )}
    >
      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
