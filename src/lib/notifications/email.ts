import "server-only";

type NotifyProjectInconsistencyEmailInput = {
  to: string;
  recipientName?: string | null;
  projectId: string;
  projectTitle: string;
  issues: string[];
  triggeredByUserId: string;
};

type NotifyNeedApplicationCreatedEmailInput = {
  to: string;
  recipientName?: string | null;
  projectId: string;
  projectTitle: string;
  needTitle: string;
  needType: string;
  applicantName?: string | null;
  applicantEmail?: string | null;
  message?: string | null;
  triggeredByUserId: string;
};

type NotifyNeedApplicationDecisionEmailInput = {
  to: string;
  recipientName?: string | null;
  projectId: string;
  projectTitle: string;
  needTitle: string;
  decision: "ACCEPTED" | "REJECTED";
  decisionNote?: string | null;
  triggeredByUserId: string;
};

type ResendResponse = {
  id?: string;
  error?: {
    message?: string;
    name?: string;
  };
};

type GenericResendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function normalizeBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function getBaseUrl() {
  const fromEnv =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (fromEnv && /^https?:\/\//i.test(fromEnv.trim())) {
    return fromEnv.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function getEmailConfig() {
  return {
    enabled: normalizeBoolean(process.env.NOTIFICATION_EMAIL_ENABLED),
    provider: (process.env.NOTIFICATION_EMAIL_PROVIDER || "resend").toLowerCase(),
    from: process.env.NOTIFICATION_EMAIL_FROM || "",
    replyTo: process.env.NOTIFICATION_EMAIL_REPLY_TO || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(input: NotifyProjectInconsistencyEmailInput) {
  const baseUrl = getBaseUrl();
  const publicUrl = `${baseUrl}/projects/${input.projectId}`;
  const editUrl = `${baseUrl}/dashboard/projects/${input.projectId}/edit`;
  const issueItems = input.issues
    .map((issue) => `<li>${escapeHtml(issue)}</li>`)
    .join("");

  const recipient = input.recipientName?.trim() || "Bonjour";

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #0f172a;">
      <p>${escapeHtml(recipient)},</p>
      <p>
        Votre projet <strong>${escapeHtml(
          input.projectTitle
        )}</strong> contient des incohérences à corriger:
      </p>
      <ul>${issueItems}</ul>
      <p>Actions recommandées:</p>
      <ul>
        <li><a href="${editUrl}">Modifier le projet</a></li>
        <li><a href="${publicUrl}">Voir la page détail</a></li>
      </ul>
      <p style="margin-top: 16px; color: #475569;">
        Notification envoyée par l'espace pilotage (utilisateur: ${escapeHtml(
          input.triggeredByUserId
        )}).
      </p>
    </div>
  `;
}

function buildEmailText(input: NotifyProjectInconsistencyEmailInput) {
  const baseUrl = getBaseUrl();
  const publicUrl = `${baseUrl}/projects/${input.projectId}`;
  const editUrl = `${baseUrl}/dashboard/projects/${input.projectId}/edit`;
  const recipient = input.recipientName?.trim() || "Bonjour";

  return [
    `${recipient},`,
    "",
    `Votre projet "${input.projectTitle}" contient des incohérences à corriger:`,
    ...input.issues.map((issue) => `- ${issue}`),
    "",
    "Actions recommandées:",
    `- Modifier le projet: ${editUrl}`,
    `- Voir la page détail: ${publicUrl}`,
    "",
    `Notification envoyée depuis le dashboard (utilisateur: ${input.triggeredByUserId}).`,
  ].join("\n");
}

async function sendGenericWithResend(input: GenericResendEmailInput) {
  const config = getEmailConfig();
  if (!config.resendApiKey) {
    return {
      sent: false,
      reason: "RESEND_API_KEY manquant",
    } as const;
  }

  if (!config.from) {
    return {
      sent: false,
      reason: "NOTIFICATION_EMAIL_FROM manquant",
    } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok || payload.error) {
    return {
      sent: false,
      reason:
        payload.error?.message ||
        `Resend HTTP ${response.status}`,
    } as const;
  }

  return {
    sent: true,
    providerMessageId: payload.id ?? null,
  } as const;
}

async function sendWithResend(input: NotifyProjectInconsistencyEmailInput) {
  return sendGenericWithResend({
    to: input.to,
    subject: `Action requise: corriger le projet "${input.projectTitle}"`,
    text: buildEmailText(input),
    html: buildEmailHtml(input),
  });
}

async function sendDashboardEmail(input: GenericResendEmailInput) {
  const config = getEmailConfig();
  if (!config.enabled) {
    return {
      sent: false,
      skipped: true,
      reason: "NOTIFICATION_EMAIL_ENABLED=false",
    } as const;
  }

  if (config.provider !== "resend") {
    return {
      sent: false,
      skipped: true,
      reason: `Provider non supporté: ${config.provider}`,
    } as const;
  }

  const result = await sendGenericWithResend(input);
  if (!result.sent) {
    return {
      sent: false,
      skipped: false,
      reason: result.reason,
    } as const;
  }

  return {
    sent: true,
    skipped: false,
    provider: "resend",
    providerMessageId: result.providerMessageId,
  } as const;
}

export async function sendProjectInconsistencyNotificationEmail(
  input: NotifyProjectInconsistencyEmailInput
) {
  return sendDashboardEmail({
    to: input.to,
    subject: `Action requise: corriger le projet "${input.projectTitle}"`,
    text: buildEmailText(input),
    html: buildEmailHtml(input),
  });
}

export async function sendNeedApplicationCreatedEmail(
  input: NotifyNeedApplicationCreatedEmailInput
) {
  const baseUrl = getBaseUrl();
  const editUrl = `${baseUrl}/dashboard/projects/${input.projectId}/edit`;
  const applicationsUrl = `${baseUrl}/dashboard/projects/applications`;
  const recipient = input.recipientName?.trim() || "Bonjour";
  const applicant =
    input.applicantName?.trim() || input.applicantEmail?.trim() || "Un utilisateur";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #0f172a;">
      <p>${escapeHtml(recipient)},</p>
      <p>
        Nouvelle candidature sur le projet <strong>${escapeHtml(
          input.projectTitle
        )}</strong>.
      </p>
      <p>
        Besoin: <strong>${escapeHtml(input.needTitle)}</strong> (${escapeHtml(input.needType)})
      </p>
      <p>
        Candidat: <strong>${escapeHtml(applicant)}</strong>
      </p>
      ${
        input.message?.trim()
          ? `<p>Message: ${escapeHtml(input.message.trim())}</p>`
          : ""
      }
      <p>Actions recommandées:</p>
      <ul>
        <li><a href="${applicationsUrl}">Ouvrir la file des candidatures</a></li>
        <li><a href="${editUrl}">Modifier le projet</a></li>
      </ul>
      <p style="margin-top: 16px; color: #475569;">
        Notification envoyée depuis la page publique (utilisateur: ${escapeHtml(
          input.triggeredByUserId
        )}).
      </p>
    </div>
  `;

  const text = [
    `${recipient},`,
    "",
    `Nouvelle candidature sur le projet "${input.projectTitle}".`,
    `Besoin: ${input.needTitle} (${input.needType})`,
    `Candidat: ${applicant}`,
    input.message?.trim() ? `Message: ${input.message.trim()}` : null,
    "",
    "Actions recommandées:",
    `- Ouvrir la file des candidatures: ${applicationsUrl}`,
    `- Modifier le projet: ${editUrl}`,
    "",
    `Notification envoyée depuis la page publique (utilisateur: ${input.triggeredByUserId}).`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendDashboardEmail({
    to: input.to,
    subject: `Nouvelle candidature sur "${input.projectTitle}"`,
    text,
    html,
  });
}

export async function sendNeedApplicationDecisionEmail(
  input: NotifyNeedApplicationDecisionEmailInput
) {
  const baseUrl = getBaseUrl();
  const detailUrl = `${baseUrl}/projects/${input.projectId}`;
  const recipient = input.recipientName?.trim() || "Bonjour";
  const decisionLabel = input.decision === "ACCEPTED" ? "acceptée" : "refusée";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #0f172a;">
      <p>${escapeHtml(recipient)},</p>
      <p>
        Votre candidature sur le projet <strong>${escapeHtml(
          input.projectTitle
        )}</strong> pour le besoin <strong>${escapeHtml(input.needTitle)}</strong> a été
        <strong>${decisionLabel}</strong>.
      </p>
      ${
        input.decisionNote?.trim()
          ? `<p>Note du porteur: ${escapeHtml(input.decisionNote.trim())}</p>`
          : ""
      }
      <p><a href="${detailUrl}">Voir le projet</a></p>
      <p style="margin-top: 16px; color: #475569;">
        Notification décision envoyée par l'espace membre (utilisateur: ${escapeHtml(
          input.triggeredByUserId
        )}).
      </p>
    </div>
  `;

  const text = [
    `${recipient},`,
    "",
    `Votre candidature sur le projet "${input.projectTitle}" pour le besoin "${input.needTitle}" a été ${decisionLabel}.`,
    input.decisionNote?.trim() ? `Note du porteur: ${input.decisionNote.trim()}` : null,
    `Voir le projet: ${detailUrl}`,
    "",
    `Notification décision envoyée par l'espace membre (utilisateur: ${input.triggeredByUserId}).`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendDashboardEmail({
    to: input.to,
    subject: `Décision candidature: ${input.projectTitle}`,
    text,
    html,
  });
}
