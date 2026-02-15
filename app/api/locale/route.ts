import { NextRequest, NextResponse } from "next/server";
import {
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "@/src/i18n";

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath) {
    return "/";
  }

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}

function buildRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const nextPathParam = request.nextUrl.searchParams.get("next");
  const locale = localeParam?.toLowerCase() ?? "";

  if (!isSupportedLocale(locale)) {
    return NextResponse.json(
      {
        message: `Unsupported locale. Allowed values: ${SUPPORTED_LOCALES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const targetPath = sanitizeNextPath(nextPathParam);
  const redirectUrl = new URL(targetPath, buildRequestOrigin(request));
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
