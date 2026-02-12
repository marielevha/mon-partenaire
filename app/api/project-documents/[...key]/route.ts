import { fetchProjectDocumentObject } from "@/src/lib/s3-storage";

type RouteParams = {
  key?: string[];
};

function sanitizeFileName(name: string) {
  return name.replace(/[\r\n"]/g, "_").trim() || "document";
}

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  const requestUrl = new URL(request.url);
  const previewMode =
    requestUrl.searchParams.get("preview") === "1" ||
    requestUrl.searchParams.get("disposition") === "inline";
  const resolvedParams = await context.params;
  const keySegments = resolvedParams.key ?? [];

  if (keySegments.length === 0) {
    return new Response("Document key manquante.", { status: 400 });
  }

  const objectKey = keySegments.map((segment) => decodeURIComponent(segment)).join("/");

  try {
    const upstream = await fetchProjectDocumentObject(objectKey);
    const headers = new Headers();

    const contentType = upstream.headers.get("content-type");
    const contentLength = upstream.headers.get("content-length");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");
    const cacheControl = upstream.headers.get("cache-control");
    const upstreamDisposition = upstream.headers.get("content-disposition");
    const fallbackName = sanitizeFileName(
      decodeURIComponent(keySegments[keySegments.length - 1] ?? "document")
    );

    if (contentType) headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);
    if (etag) headers.set("etag", etag);
    if (lastModified) headers.set("last-modified", lastModified);
    if (previewMode) {
      headers.set("content-disposition", `inline; filename="${fallbackName}"`);
    } else {
      headers.set(
        "content-disposition",
        upstreamDisposition ?? `attachment; filename="${fallbackName}"`
      );
    }
    headers.set("cache-control", cacheControl ?? "private, max-age=300");

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document introuvable.";
    return new Response(message, { status: 404 });
  }
}
