import type { H3Event } from "h3";
import { writeSecurityAudit } from "~~/server/utils/securityAudit";

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const DOUBLE_EXT_DANGER = /\.(?:php\d*|phtml|phar|cgi|pl|py|rb|sh|bash|cmd|bat|ps1|js|mjs|cjs|html?|svg|xml|exe|dll|com|scr|msi|jar|hta|vbs|vbe|wsf|wsh)(?:\.|$)/i;

export const safeUploadBaseName = (filename: string, fallback = "file", max = 70) => {
  const leaf = String(filename || "").replace(CONTROL_CHARS, "").replace(/\\/g, "/").split("/").pop() || "";
  const withoutExt = leaf.replace(/\.[^.]+$/, "");
  return withoutExt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || fallback;
};

export const uploadExtension = (filename: string) =>
  (String(filename || "").toLowerCase().match(/\.([a-z0-9]{1,10})$/)?.[1] || "");

export const filenameLooksDangerous = (filename: string) => {
  const value = String(filename || "").replace(CONTROL_CHARS, "");
  return value.includes("..") || value.includes("/") || value.includes("\\") || DOUBLE_EXT_DANGER.test(value);
};

export const bytesStartWith = (data: Uint8Array, bytes: number[]) =>
  data.length >= bytes.length && bytes.every((value, index) => data[index] === value);

export const isPdf = (data: Uint8Array) => bytesStartWith(data, [0x25, 0x50, 0x44, 0x46, 0x2d]);
export const isZip = (data: Uint8Array) =>
  bytesStartWith(data, [0x50, 0x4b, 0x03, 0x04]) ||
  bytesStartWith(data, [0x50, 0x4b, 0x05, 0x06]) ||
  bytesStartWith(data, [0x50, 0x4b, 0x07, 0x08]);

export const auditRejectedUpload = async (event: H3Event, reason: string, filename?: string) => {
  await writeSecurityAudit(event, {
    action: "upload.rejected",
    severity: "warning",
    outcome: "denied",
    details: {
      reason: String(reason).slice(0, 160),
      filename: filename ? String(filename).replace(CONTROL_CHARS, "").slice(0, 120) : undefined,
    },
  });
};
