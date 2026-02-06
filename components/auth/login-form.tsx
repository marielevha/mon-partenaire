"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { loginAction } from "@/app/auth/actions";

const inputStyles =
  "h-12 w-full rounded-[calc(var(--radius)_-_8px)] border border-border bg-surface px-4 text-sm text-text-primary shadow-soft transition-colors placeholder:text-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const initialState = null;

type LoginState =
  | null
  | { ok: false; message: string }
  | { ok: true; full_name?: string };

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Connexion..." : "Se connecter"}
    </Button>
  );
};

interface LoginFormProps {
  onSubmit?: (email: string) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Redirect after successful login and store full_name
  useEffect(() => {
    if (state?.ok === true) {
      if (state.full_name) {
        localStorage.setItem("user_full_name", state.full_name);
      }
      router.push("/");
    }
  }, [state, router]);

  const handleFormAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    if (email) {
      // Stocke l'email dans le localStorage avant la soumission
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
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between text-sm text-text-secondary">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-accent transition-colors hover:text-accent-strong"
        >
          Mot de passe oublié ?
        </Link>
        <span className="text-xs">Support 7j/7</span>
      </div>

      {state?.ok === false ? (
        <div className="rounded-[calc(var(--radius)_-_8px)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
