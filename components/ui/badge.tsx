import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-accent/30 bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-accent",
        className
      )}
      {...props}
    />
  );
}
