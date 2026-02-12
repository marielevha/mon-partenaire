import type { NextConfig } from "next";

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
  },
];

function addRemotePatternFromUrl(rawUrl?: string) {
  if (!rawUrl) {
    return;
  }

  try {
    const url = new URL(rawUrl);
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    });
  } catch {
    // Ignore invalid URL format in env
  }
}

addRemotePatternFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
addRemotePatternFromUrl(process.env.S3_PUBLIC_URL);
addRemotePatternFromUrl(process.env.S3_ENDPOINT);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
