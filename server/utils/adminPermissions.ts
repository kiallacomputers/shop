import type { H3Event } from "h3";
import { getRequestURL } from "h3";

export const ADMIN_SECTIONS = ["product", "sales", "purchase", "accounting", "administration", "business"] as const;
export type AdminSection = typeof ADMIN_SECTIONS[number];
export type AdminPermissions = Record<AdminSection, boolean>;

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  product: true, sales: true, purchase: true, accounting: true, administration: true, business: true,
};

export function normaliseAdminPermissions(value: any): AdminPermissions {
  return Object.fromEntries(ADMIN_SECTIONS.map((key) => [key, value?.[key] === true])) as AdminPermissions;
}

export function adminSectionForPath(pathname: string): AdminSection | null {
  const path = String(pathname || "").split("?")[0].toLowerCase();
  const p = path.replace(/^\/api/, "");

  if (/^\/admin\/(products|categories|reviews|back-in-stock|inventory)(\/|$)/.test(p)) return "product";
  if (/^\/admin\/(orders|manual-quotes|quotes|customers)(\/|$)/.test(p)) return "sales";
  if (/^\/admin\/purchasing(\/|$)/.test(p) || /^\/admin\/suppliers(\/|$)/.test(p)) return "purchase";
  if (/^\/admin\/accounting(\/|$)/.test(p)) return "accounting";
  if (/^\/admin\/(chat|accounts|security|security-groups|storage-cleanup)(\/|$)/.test(p)) return "administration";
  if (/^\/admin\/(ads|freight|pricing-levels|abandoned-carts|analytics|marketing-seo|google-shopping|google-performance|google-search|google-merchant-registration|reports|facebook-share)(\/|$)/.test(p)) return "business";
  return null;
}

export function requestAdminSection(event: H3Event): AdminSection | null {
  return adminSectionForPath(getRequestURL(event).pathname);
}
