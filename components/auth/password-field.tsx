"use client";

import { useId, useState } from "react";
import { cn } from "@/components/ui/utils";

interface PasswordFieldProps {
  label: string;
  name: string;
  showLabel?: string;
  hideLabel?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}

export function PasswordField({
  label,
  name,
  showLabel = "Afficher",
  hideLabel = "Masquer",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="flex flex-col gap-2 text-sm text-text-primary">
      <span className="font-medium">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={
            onChange ? (event) => onChange(event.target.value) : undefined
          }
          placeholder={placeholder}
          required={required}
          className={cn(
            "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 pr-16 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            error && "border-rose-400 focus-visible:ring-rose-300"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-accent hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
        >
          {visible ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3 21 21" />
              <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
              <path d="M9.4 5.1A10.9 10.9 0 0 1 12 4c5.2 0 9.2 3.4 10 8-.3 1.9-1.2 3.6-2.5 5" />
              <path d="M6.6 6.7C4.5 8 2.9 9.9 2 12c.8 2.8 2.9 5.1 5.7 6.4" />
              <path d="M14.1 18.7c-.7.2-1.4.3-2.1.3-1 0-1.9-.2-2.8-.4" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8-10-8-10-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          <span className="sr-only">{visible ? hideLabel : showLabel}</span>
        </button>
      </div>
      {error ? (
        <span className="text-xs text-rose-500">{error}</span>
      ) : null}
    </label>
  );
}
