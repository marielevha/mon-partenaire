import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonVariants({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60",
    size === "sm" && "h-9 px-4 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-base",
    variant === "primary" &&
      "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-medium hover:from-accent-strong hover:to-accent-secondary/90",
    variant === "secondary" &&
      "border border-border bg-surface text-text-primary shadow-soft hover:border-accent/40 hover:text-accent",
    variant === "ghost" &&
      "text-text-primary hover:bg-accent/10 hover:text-accent"
  );
}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
