import type { H3Event } from "h3";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export function requireObjectBody(value: unknown): Record<string, any> {
  if (!isPlainObject(value)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body." });
  }
  return value as Record<string, any>;
}

export function cleanInputText(value: unknown, max: number, options: { multiline?: boolean } = {}) {
  let text = String(value ?? "").replace(CONTROL_CHARS, "");
  if (!options.multiline) text = text.replace(/[\r\n\t]+/g, " ");
  text = text.trim();
  if (text.length > max) {
    throw createError({ statusCode: 422, statusMessage: `Text must be ${max} characters or less.` });
  }
  return text;
}

export function requireEmail(value: unknown, max = 254) {
  const email = cleanInputText(value, max).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw createError({ statusCode: 422, statusMessage: "A valid email address is required." });
  }
  return email;
}

export function optionalEmail(value: unknown, max = 254) {
  const email = cleanInputText(value, max).toLowerCase();
  return email ? requireEmail(email, max) : "";
}

export function requirePositiveInteger(value: unknown, label = "Value", max = 1_000_000) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0 || number > max) {
    throw createError({ statusCode: 422, statusMessage: `${label} is invalid.` });
  }
  return number;
}

export function requireArray(value: unknown, label: string, maxItems: number) {
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: `${label} must be a list.` });
  }
  if (value.length > maxItems) {
    throw createError({ statusCode: 422, statusMessage: `${label} contains too many items.` });
  }
  return value;
}

export function assertAllowedKeys(body: Record<string, any>, allowed: readonly string[]) {
  const allowedSet = new Set(allowed);
  if (Object.keys(body).some((key) => !allowedSet.has(key))) {
    throw createError({ statusCode: 400, statusMessage: "The request contains unsupported fields." });
  }
}

export function rejectOversizedContentLength(event: H3Event, maxBytes: number) {
  const raw = String(getHeader(event, "content-length") || "").trim();
  if (!raw) return;
  const bytes = Number(raw);
  if (Number.isFinite(bytes) && bytes > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: "Request is too large." });
  }
}
