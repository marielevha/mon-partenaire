import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-border bg-surface p-6 shadow-soft transition-colors",
        className
      )}
      {...props}
    />
  );
}
