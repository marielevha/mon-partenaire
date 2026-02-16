import "server-only";

import { headers } from "next/headers";
import { getLoggingConfig } from "@/src/lib/logging/config";
import { createLogger } from "@/src/lib/logging/logger";

export async function getServerActionLogger(
  actionName: string,
  bindings?: Record<string, unknown>
) {
  const config = getLoggingConfig();
  const requestHeaders = await headers();
  const requestId =
    requestHeaders.get(config.requestIdHeader) ||
    requestHeaders.get("x-request-id") ||
    undefined;

  return createLogger({
    scope: "server-action",
    action: actionName,
    requestId,
    ...(bindings ?? {}),
  });
}
