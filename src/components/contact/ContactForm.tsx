"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
};

type FieldErrors = Partial<Record<keyof ContactFormState, string>>;

type SubmissionStatus = "idle" | "success" | "error";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultValues: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
};

function validateContactForm(values: ContactFormState): FieldErrors {
  const nextErrors: FieldErrors = {};

  if (!values.name.trim()) {
    nextErrors.name = "Le nom est requis.";
  } else if (values.name.trim().length < 2) {
    nextErrors.name = "Le nom doit contenir au moins 2 caractères.";
  } else if (values.name.trim().length > 80) {
    nextErrors.name = "Le nom ne peut pas dépasser 80 caractères.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "L'email est requis.";
  } else if (!emailRegex.test(values.email.trim())) {
    nextErrors.email = "Veuillez saisir une adresse email valide.";
  }

  if (!values.subject.trim()) {
    nextErrors.subject = "Le sujet est requis.";
  } else if (values.subject.trim().length < 2) {
    nextErrors.subject = "Le sujet doit contenir au moins 2 caractères.";
  } else if (values.subject.trim().length > 120) {
    nextErrors.subject = "Le sujet ne peut pas dépasser 120 caractères.";
  }

  if (!values.message.trim()) {
    nextErrors.message = "Le message est requis.";
  } else if (values.message.trim().length < 10) {
    nextErrors.message = "Le message doit contenir au moins 10 caractères.";
  } else if (values.message.trim().length > 2000) {
    nextErrors.message = "Le message ne peut pas dépasser 2000 caractères.";
  }

  if (!values.consent) {
    nextErrors.consent = "Vous devez accepter l'utilisation de vos informations.";
  }

  return nextErrors;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormState>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, type } = event.target;
    const fieldName = name as keyof ContactFormState;
    const value =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : event.target.value;

    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");

    const nextErrors = validateContactForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setValues(defaultValues);
      setErrors({});
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="rounded-3xl border border-border/80 bg-surface p-6 shadow-soft sm:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary" htmlFor={`${formId}-name`}>
            Nom
          </label>
          <input
            className={cn(
              "w-full rounded-[var(--radius)] border border-border bg-background px-4 py-3 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              errors.name && "border-red-500 focus-visible:ring-red-500/40"
            )}
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          />
          {errors.name ? (
            <p className="text-xs text-red-600" id={`${formId}-name-error`}>
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary" htmlFor={`${formId}-email`}>
            Email
          </label>
          <input
            className={cn(
              "w-full rounded-[var(--radius)] border border-border bg-background px-4 py-3 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              errors.email && "border-red-500 focus-visible:ring-red-500/40"
            )}
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          />
          {errors.email ? (
            <p className="text-xs text-red-600" id={`${formId}-email-error`}>
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <label className="text-sm font-medium text-text-primary" htmlFor={`${formId}-subject`}>
          Sujet
        </label>
        <input
          className={cn(
            "w-full rounded-[var(--radius)] border border-border bg-background px-4 py-3 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            errors.subject && "border-red-500 focus-visible:ring-red-500/40"
          )}
          id={`${formId}-subject`}
          name="subject"
          type="text"
          value={values.subject}
          onChange={handleChange}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? `${formId}-subject-error` : undefined}
        />
        {errors.subject ? (
          <p className="text-xs text-red-600" id={`${formId}-subject-error`}>
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2">
        <label className="text-sm font-medium text-text-primary" htmlFor={`${formId}-message`}>
          Message
        </label>
        <textarea
          className={cn(
            "min-h-[160px] w-full resize-y rounded-[var(--radius)] border border-border bg-background px-4 py-3 text-sm text-text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            errors.message && "border-red-500 focus-visible:ring-red-500/40"
          )}
          id={`${formId}-message`}
          name="message"
          value={values.message}
          onChange={handleChange}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
        />
        {errors.message ? (
          <p className="text-xs text-red-600" id={`${formId}-message-error`}>
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-2">
        <label className="flex items-start gap-3 text-sm text-text-secondary" htmlFor={`${formId}-consent`}>
          <input
            className={cn(
              "mt-1 h-4 w-4 rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              errors.consent && "border-red-500 focus-visible:ring-red-500/40"
            )}
            id={`${formId}-consent`}
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={handleChange}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? `${formId}-consent-error` : undefined}
          />
          <span>
            J&apos;accepte que mes informations soient utilisées pour être recontacté.
          </span>
        </label>
        {errors.consent ? (
          <p className="text-xs text-red-600" id={`${formId}-consent-error`}>
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi en cours…" : "Envoyer"}
        </Button>
        {status === "success" ? (
          <p className="text-sm text-emerald-600">Message envoyé.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-red-600">Une erreur est survenue. Réessayez.</p>
        ) : null}
      </div>
    </form>
  );
}
