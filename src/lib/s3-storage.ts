import { createHash, createHmac } from "node:crypto";

const DEFAULT_S3_REGION = "us-east-1";

type S3Env = {
  endpoint: URL;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
};

function requireS3Env(): S3Env {
  const endpointValue = process.env.S3_ENDPOINT?.trim();
  const accessKey = process.env.S3_ACCESS_KEY?.trim();
  const secretKey = process.env.S3_SECRET_KEY?.trim();
  const bucket = process.env.S3_BUCKET?.trim();

  if (!endpointValue || !accessKey || !secretKey || !bucket) {
    throw new Error(
      "Configuration S3 incomplète. Variables requises: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET."
    );
  }

  return {
    endpoint: new URL(endpointValue),
    region: process.env.S3_REGION?.trim() || DEFAULT_S3_REGION,
    accessKey,
    secretKey,
    bucket,
  };
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(date: Date): string {
  return toAmzDate(date).slice(0, 8);
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodePath(pathValue: string): string {
  return pathValue
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeRfc3986(segment))
    .join("/");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getSigningKey(secretKey: string, dateStamp: string, region: string) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function createPresignedS3Url(method: "PUT" | "DELETE" | "GET", key: string): string {
  const { endpoint, region, accessKey, secretKey, bucket } = requireS3Env();

  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

  const basePath = endpoint.pathname.replace(/\/$/, "");
  const encodedObjectPath = encodePath(`${bucket}/${key}`);
  const canonicalUri = `${basePath}/${encodedObjectPath}`;

  const canonicalQueryPairs: Array<[string, string]> = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKey}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", "900"],
    ["X-Amz-SignedHeaders", "host"],
  ];

  canonicalQueryPairs.sort(([a], [b]) => a.localeCompare(b));
  const canonicalQueryString = canonicalQueryPairs
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalHeaders = `host:${endpoint.host}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretKey, dateStamp, region);
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const origin = `${endpoint.protocol}//${endpoint.host}`;
  return `${origin}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

async function uploadS3Object(file: File, key: string) {
  const presignedUrl = createPresignedS3Url("PUT", key);
  const body = Buffer.from(await file.arrayBuffer());

  const response = await fetch(presignedUrl, {
    method: "PUT",
    body,
    headers: file.type ? { "content-type": file.type } : undefined,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Echec upload objet S3 (${response.status}). ${details}`.trim()
    );
  }

  return key;
}

async function fetchS3Object(key: string) {
  const presignedUrl = createPresignedS3Url("GET", key);
  const response = await fetch(presignedUrl, { method: "GET" });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Echec lecture objet S3 (${response.status}). ${details}`.trim()
    );
  }
  return response;
}

async function deleteS3Objects(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  await Promise.all(
    keys.map(async (key) => {
      const presignedUrl = createPresignedS3Url("DELETE", key);
      await fetch(presignedUrl, { method: "DELETE" }).catch(() => undefined);
    })
  );
}

function resolveS3PublicUrlFromStoredValueWithRoute(
  value: string,
  routePrefix: string
): string | null {
  const objectKey = resolveS3ObjectKey(value);
  if (!objectKey) return null;
  return `${routePrefix}/${encodePath(objectKey)}`;
}

export async function uploadProjectImageObject(file: File, key: string) {
  const objectKey = await uploadS3Object(file, key);
  return { objectKey };
}

export async function uploadProjectDocumentObject(file: File, key: string) {
  const objectKey = await uploadS3Object(file, key);
  return { objectKey };
}

export async function fetchProjectImageObject(key: string) {
  return fetchS3Object(key);
}

export async function fetchProjectDocumentObject(key: string) {
  return fetchS3Object(key);
}

export async function deleteProjectImageObjects(keys: string[]) {
  return deleteS3Objects(keys);
}

export async function deleteProjectDocumentObjects(keys: string[]) {
  return deleteS3Objects(keys);
}

export function resolveS3PublicUrlFromStoredValue(value: string): string | null {
  return resolveS3PublicUrlFromStoredValueWithRoute(value, "/api/project-images");
}

export function resolveS3DocumentPublicUrlFromStoredValue(value: string): string | null {
  return resolveS3PublicUrlFromStoredValueWithRoute(value, "/api/project-documents");
}

export function resolveS3ObjectKey(value: string): string | null {
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, "");
  }

  try {
    const { bucket } = requireS3Env();
    const url = new URL(value);
    const rawSegments = url.pathname
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => decodeURIComponent(segment));

    const bucketIndex = rawSegments.findIndex((segment) => segment === bucket);
    if (bucketIndex >= 0 && rawSegments.length > bucketIndex + 1) {
      return rawSegments.slice(bucketIndex + 1).join("/");
    }

    if (rawSegments[0] === "storage" && rawSegments[1] === "v1") {
      const objectIndex = rawSegments.findIndex((segment) => segment === "object");
      if (objectIndex >= 0) {
        const supabaseBucketIndex = objectIndex + 2;
        if (
          rawSegments[supabaseBucketIndex] === bucket &&
          rawSegments.length > supabaseBucketIndex + 1
        ) {
          return rawSegments.slice(supabaseBucketIndex + 1).join("/");
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
