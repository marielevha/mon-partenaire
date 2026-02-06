"use client";

import { useId, useState } from "react";
import { cn } from "@/components/ui/utils";

interface PasswordFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export function PasswordField({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
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
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 pr-16 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            error && "border-rose-400 focus-visible:ring-rose-300"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          {visible ? "Masquer" : "Afficher"}
        </button>
      </div>
      {error ? (
        <span className="text-xs text-rose-500">{error}</span>
      ) : null}
    </label>
  );
}
