import { timingSafeEqual } from "node:crypto";

/**
 * Machine-to-machine authentication for the blog publisher.
 *
 * Requires BLOG_BOT_SECRET (>= 16 chars). Accepts either
 * `Authorization: Bearer <secret>` or `x-blog-bot-secret: <secret>`.
 */
export function isBlogBotAuthorized(request: Request): boolean {
  const secret = process.env.BLOG_BOT_SECRET;
  if (!secret || secret.length < 16) return false;

  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : request.headers.get("x-blog-bot-secret");

  if (!provided) return false;

  const expected = Buffer.from(secret);
  const received = Buffer.from(provided);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function blogBotSecretConfigured(): boolean {
  return (process.env.BLOG_BOT_SECRET?.length ?? 0) >= 16;
}
