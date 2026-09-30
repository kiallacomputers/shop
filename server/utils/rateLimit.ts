import { createHash } from "node:crypto";
import type { H3Event } from "h3";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

type RateLimitOptions = {
  bucket: string;
  max: number;
  windowSeconds: number;
  identity?: string | null;
};

const clientAddress = (event: H3Event) => {
  const candidates = [
    getHeader(event, "x-nf-client-connection-ip"),
    getHeader(event, "cf-connecting-ip"),
    getHeader(event, "x-real-ip"),
    String(getHeader(event, "x-forwarded-for") || "").split(",")[0],
  ];

  for (const value of candidates) {
    const ip = String(value || "").trim();
    if (ip) return ip.slice(0, 128);
  }

  return "unknown";
};

const hashKey = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function enforceRateLimit(
  event: H3Event,
  options: RateLimitOptions,
) {
  const identity = String(options.identity || clientAddress(event)).trim() || "unknown";
  const keyHash = hashKey(`${options.bucket}:${identity}`);

  try {
    const db = getAdminSupabase();
    const { data, error } = await db.rpc("kc_consume_rate_limit", {
      p_bucket: options.bucket,
      p_key_hash: keyHash,
      p_max_requests: options.max,
      p_window_seconds: options.windowSeconds,
    });

    if (error) {
      // Fail open so a database migration/configuration issue never takes the
      // storefront offline. The error is loud in Netlify logs.
      console.error("RATE LIMIT CHECK ERROR:", {
        bucket: options.bucket,
        message: error.message,
      });
      return;
    }

    const result: any = Array.isArray(data) ? data[0] : data;
    if (!result) return;

    const remaining = Math.max(0, Number(result.remaining ?? 0));
    const retryAfter = Math.max(1, Number(result.retry_after ?? 1));

    setHeader(event, "X-RateLimit-Limit", String(options.max));
    setHeader(event, "X-RateLimit-Remaining", String(remaining));

    if (result.allowed === false) {
      setHeader(event, "Retry-After", String(retryAfter));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many requests. Please wait a little while and try again.",
      });
    }
  } catch (error: any) {
    if (Number(error?.statusCode) === 429) throw error;

    // Fail open for infrastructure errors, but record them for investigation.
    console.error("RATE LIMIT INFRASTRUCTURE ERROR:", {
      bucket: options.bucket,
      message: error?.message || String(error),
    });
  }
}
