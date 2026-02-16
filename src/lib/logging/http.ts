import "server-only";

import { getLoggingConfig } from "@/src/lib/logging/config";

export function getRequestIdFromRequest(request: Request): string {
  const config = getLoggingConfig();
  return (
    request.headers.get(config.requestIdHeader) ||
    request.headers.get("x-request-id") ||
    crypto.randomUUID()
  );
}

export function getClientIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function buildApiLogContext(
  request: Request,
  additional?: Record<string, unknown>
) {
  const url = new URL(request.url);
  return {
    requestId: getRequestIdFromRequest(request),
    method: request.method,
    path: url.pathname,
    query: url.search,
    clientIp: getClientIpFromRequest(request),
    userAgent: request.headers.get("user-agent") || "unknown",
    ...(additional ?? {}),
  };
}
