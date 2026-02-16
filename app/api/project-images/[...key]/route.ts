import { fetchProjectImageObject } from "@/src/lib/s3-storage";
import { buildApiLogContext } from "@/src/lib/logging/http";
import { createLogger } from "@/src/lib/logging/logger";

type RouteParams = {
  key?: string[];
};

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  const logContext = buildApiLogContext(request, { route: "/api/project-images/[...key]" });
  const routeLogger = createLogger(logContext);
  const resolvedParams = await context.params;
  const keySegments = resolvedParams.key ?? [];

  if (keySegments.length === 0) {
    routeLogger.warn("Project image fetch failed: missing object key");
    return new Response("Image key manquante.", { status: 400 });
  }

  const objectKey = keySegments.map((segment) => decodeURIComponent(segment)).join("/");

  try {
    const upstream = await fetchProjectImageObject(objectKey);
    const headers = new Headers();

    const contentType = upstream.headers.get("content-type");
    const contentLength = upstream.headers.get("content-length");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");
    const cacheControl = upstream.headers.get("cache-control");

    if (contentType) headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);
    if (etag) headers.set("etag", etag);
    if (lastModified) headers.set("last-modified", lastModified);
    headers.set("cache-control", cacheControl ?? "public, max-age=3600");

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image introuvable.";
    routeLogger.warn("Project image fetch failed", { objectKey, error });
    return new Response(message, { status: 404 });
  }
}
