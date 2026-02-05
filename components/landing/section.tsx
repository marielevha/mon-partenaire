import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("py-16 sm:py-20", className)}
      {...props}
    />
  );
}
