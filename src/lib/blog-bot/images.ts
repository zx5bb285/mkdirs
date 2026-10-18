import { isIP } from "node:net";
import { sanityClient } from "@/sanity/lib/client";
import {
  type ImageAssetMap,
  extractImageUrls,
} from "./markdown-to-portable-text";

const MAX_IMAGE_BYTES = Number(
  process.env.BLOG_BOT_MAX_IMAGE_BYTES || 20 * 1024 * 1024,
);
const DOWNLOAD_TIMEOUT_MS = 20_000;

export interface ImageMirrorResult {
  map: ImageAssetMap;
  uploaded: number;
  failed: Array<{ url: string; reason: string }>;
}

/**
 * Downloads every image referenced in the markdown and stores it in Sanity.
 *
 * Articles must not hotlink third-party images: those URLs rot, block
 * hotlinking, or disappear, leaving broken images in published posts.
 */
export async function mirrorMarkdownImages(
  markdown: string,
): Promise<ImageMirrorResult> {
  const urls = extractImageUrls(markdown);
  return mirrorImages(urls);
}

export async function mirrorImages(urls: string[]): Promise<ImageMirrorResult> {
  const map: ImageAssetMap = new Map();
  const failed: Array<{ url: string; reason: string }> = [];
  let uploaded = 0;

  for (const url of [...new Set(urls)]) {
    try {
      const asset = await uploadRemoteImage(url);
      map.set(url, { assetId: asset._id });
      uploaded += 1;
    } catch (error) {
      failed.push({
        url,
        reason: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  return { map, uploaded, failed };
}

export async function uploadRemoteImage(
  url: string,
): Promise<{ _id: string; url: string }> {
  const parsed = safeUrl(url);
  const response = await fetch(parsed, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    headers: {
      "user-agent": "DirHuntAIBlogBot/1.0 (+https://dirhuntai.com)",
      accept: "image/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
  }

  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes`);
  }

  const filename = filenameFromUrl(parsed, contentType);
  const asset = await sanityClient.assets.upload(
    "image",
    Buffer.from(arrayBuffer),
    { filename, contentType },
  );

  return { _id: asset._id, url: asset.url };
}

/**
 * Basic SSRF guard: only public http(s) URLs are accepted.
 */
function safeUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid image URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Image URL must use http(s)");
  }
  if (isPrivateHost(url.hostname)) {
    throw new Error("Image URL points at a private address");
  }
  return url;
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return true;

  const version = isIP(host);
  if (version === 4) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (version === 6) {
    return (
      host === "::1" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80")
    );
  }
  return false;
}

function filenameFromUrl(url: URL, contentType: string): string {
  const raw = url.pathname.split("/").pop() || "image";
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleaned)) return cleaned;
  const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
  return `${cleaned.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
}
