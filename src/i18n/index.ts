import { cgMessages } from "@/src/i18n/messages/cg";
import { cookies } from "next/headers";
import { enMessages } from "@/src/i18n/messages/en";
import { frMessages, type AppMessages } from "@/src/i18n/messages/fr";

export const LOCALE_COOKIE_NAME = "mp_locale";
export const SUPPORTED_LOCALES = ["fr", "en", "cg"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "fr";

const MESSAGES_BY_LOCALE: Record<AppLocale, AppMessages> = {
  fr: frMessages,
  en: enMessages,
  cg: cgMessages,
};

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) {
    return DEFAULT_LOCALE;
  }
  const normalized = value.trim().toLowerCase();
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export async function getI18n(locale?: AppLocale): Promise<AppMessages> {
  const resolvedLocale = locale ?? (await getCurrentLocale());
  return MESSAGES_BY_LOCALE[resolvedLocale];
}
