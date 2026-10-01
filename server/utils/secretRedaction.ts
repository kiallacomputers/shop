const SECRET_KEY = /(secret|token|password|authorization|cookie|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|service[_-]?role|webhook[_-]?secret)/i;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT = /eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}/g;
const STRIPE = /\b(?:sk|rk|whsec)_(?:live|test)?_?[A-Za-z0-9]+\b/g;

export const redactString = (value: unknown, max = 2000) =>
  String(value ?? "")
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(JWT, "[REDACTED_TOKEN]")
    .replace(STRIPE, "[REDACTED_SECRET]")
    .slice(0, max);

export const redactSensitive = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return "[TRUNCATED]";
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return redactString(value);
  if (value instanceof Error) return { name: value.name, message: redactString(value.message), stack: process.env.NODE_ENV === "production" ? undefined : redactString(value.stack, 5000) };
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => redactSensitive(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      out[key] = SECRET_KEY.test(key) ? "[REDACTED]" : redactSensitive(item, depth + 1);
    }
    return out;
  }
  return redactString(value);
};
