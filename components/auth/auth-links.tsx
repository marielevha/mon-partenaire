import Link from "next/link";

interface AuthLinksProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthLinks({ text, linkText, href }: AuthLinksProps) {
  return (
    <p className="text-center text-sm text-text-secondary">
      {text}{" "}
      <Link
        href={href}
        className="font-semibold text-accent transition-colors hover:text-accent-strong"
      >
        {linkText}
      </Link>
    </p>
  );
}
