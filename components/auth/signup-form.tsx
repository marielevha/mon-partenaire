"use client";

import Link from "next/link";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { signupAction } from "@/app/auth/actions";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const initialState = null;

type ActionResult =
  | { ok: true; full_name?: string }
  | { ok: false; message: string };

type SignupState = typeof initialState | ActionResult;

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Création..." : "Créer mon compte"}
    </Button>
  );
};

interface SignupFormProps {
  onSubmit?: (email: string) => void;
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [state, formAction] = useActionState<SignupState, FormData>(
    signupAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleFormAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    if (name) {
      localStorage.setItem("user_full_name", name);
    }
    if (email) {
      localStorage.setItem("user_email", email);
      onSubmit?.(email);
    }
    await formAction(formData);
  };

  return (
    <form
      ref={formRef}
      action={handleFormAction}
      className="mx-auto w-full max-w-md space-y-5"
    >
      <label className="flex flex-col gap-2 text-sm text-text-primary">
        <span className="font-medium">Prénom</span>
        <input
          type="text"
          name="name"
          placeholder="Camille"
          autoComplete="given-name"
          className={cn(inputStyles)}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-text-primary">
        <span className="font-medium">Téléphone</span>
        <input
          type="tel"
          name="phone"
          placeholder="+242 06 123 45 67"
          autoComplete="tel"
          className={cn(inputStyles)}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-text-primary">
        <span className="font-medium">Adresse email</span>
        <input
          type="email"
          name="email"
          placeholder="prenom@email.com"
          autoComplete="email"
          className={cn(inputStyles)}
          required
        />
      </label>

      <PasswordField
        label="Mot de passe"
        name="password"
        placeholder="Au moins 8 caractères"
        autoComplete="new-password"
        required
      />

      <p className="text-xs text-text-secondary">
        En créant un compte, vous acceptez nos Conditions d'utilisation et
        notre Politique de confidentialité.
      </p>

      {state?.ok === false ? (
        <div className="rounded-[calc(var(--radius)_-_8px)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
