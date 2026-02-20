import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REQUEST_ID_HEADER =
  process.env.LOG_REQUEST_ID_HEADER?.trim().toLowerCase() || "x-request-id";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) || crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

export const config = {
  // Do not intercept any Next.js internals (HMR, dev tooling, assets).
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
