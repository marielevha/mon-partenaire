"use client";

import { useEffect, useMemo, useState } from "react";

type ContactStatus = "idle" | "success" | "error";

type ContactErrors = {
  name?: string;
  email?: string;
  message?: string;
  consent?: string;
};

interface ProjectContactActionsProps {
  projectId: string;
  projectTitle: string;
  projectCity: string;
  initialName?: string;
  initialEmail?: string;
}

const FAVORITES_STORAGE_KEY = "favorite_project_ids";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readFavoriteProjectIds() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeFavoriteProjectIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
}

function validateContactForm(values: {
  name: string;
  email: string;
  message: string;
  consent: boolean;
}) {
  const errors: ContactErrors = {};

  if (!values.name.trim()) {
    errors.name = "Le nom est requis.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  if (!values.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = "Veuillez saisir un email valide.";
  }

  if (!values.message.trim()) {
    errors.message = "Le message est requis.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Le message doit contenir au moins 10 caractères.";
  } else if (values.message.trim().length > 1800) {
    errors.message = "Le message est trop long.";
  }

  if (!values.consent) {
    errors.consent = "Le consentement est requis.";
  }

  return errors;
}

export function ProjectContactActions({
  projectId,
  projectTitle,
  projectCity,
  initialName,
  initialEmail,
}: ProjectContactActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [favoriteFeedback, setFavoriteFeedback] = useState<string | null>(null);

  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [isFavorite, setIsFavorite] = useState(() =>
    readFavoriteProjectIds().includes(projectId)
  );

  const subject = useMemo(
    () => `Demande de contact pour le projet "${projectTitle}"`,
    [projectTitle]
  );

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const toggleFavorite = () => {
    const current = readFavoriteProjectIds();
    const exists = current.includes(projectId);

    if (exists) {
      const next = current.filter((id) => id !== projectId);
      writeFavoriteProjectIds(next);
      setIsFavorite(false);
      setFavoriteFeedback("Projet retiré des favoris.");
      return;
    }

    writeFavoriteProjectIds([...current, projectId]);
    setIsFavorite(true);
    setFavoriteFeedback("Projet ajouté aux favoris.");
  };

  const openModal = () => {
    setStatus("idle");
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formValues = { name, email, message, consent };
    const nextErrors = validateContactForm(formValues);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStatus("idle");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: `${message.trim()}\n\nContexte: ${projectTitle} (${projectId}) - ${projectCity}`,
          consent,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setMessage("");
      setConsent(false);
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={openModal}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          Contacter le porteur
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface"
        >
          {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        </button>
        {favoriteFeedback ? (
          <p className="text-xs text-text-secondary">{favoriteFeedback}</p>
        ) : null}
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Contacter le porteur du projet"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-[var(--radius)] border border-border bg-surface p-6 shadow-medium"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">Prise de contact</p>
                <h2 className="mt-1 text-xl font-semibold text-text-primary">{projectTitle}</h2>
                <p className="mt-1 text-sm text-text-secondary">{projectCity}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-border px-2.5 py-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <input type="hidden" value={subject} readOnly />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Nom</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="Votre nom"
                  />
                  {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="prenom@email.com"
                  />
                  {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-text-secondary">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[130px] w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="Présentez votre profil, votre apport et vos disponibilités."
                />
                {errors.message ? <p className="text-xs text-rose-600">{errors.message}</p> : null}
              </label>

              <label className="flex items-start gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1"
                />
                <span>J&apos;accepte d&apos;être recontacté concernant ce projet.</span>
              </label>
              {errors.consent ? <p className="text-xs text-rose-600">{errors.consent}</p> : null}

              {status === "success" ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Message envoyé. Le porteur pourra vous répondre rapidement.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  Envoi impossible pour le moment. Réessayez dans quelques instants.
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
                >
                  {isSubmitting ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ProjectContactActions;
