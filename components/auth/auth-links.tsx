import Link from "next/link";
import { cn } from "@/components/ui/utils";

interface AuthLinksProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthLinks({ text, linkText, href }: AuthLinksProps) {
  return (
    <p className="rounded-[calc(var(--radius)_-_8px)] border border-border/70 bg-surface-accent/60 px-4 py-3 text-center text-sm text-text-secondary">
      <span className="mr-2">{text}</span>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center rounded-full border border-accent/40 bg-accent/12 px-3 py-1 font-semibold text-accent",
          "transition-colors hover:border-accent/60 hover:bg-accent/18 hover:text-accent-strong",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
        )}
      >
        {linkText}
      </Link>
    </p>
  );
}
