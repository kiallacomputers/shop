import type { H3Event } from "h3";
import { getMethod, getRequestURL } from "h3";

export const ADMIN_PERMISSION_GROUPS = {
  product: [
    "product.view", "product.create", "product.edit", "product.delete", "product.pricing",
    "product.categories", "product.stock", "product.reorder", "product.stocktake", "product.reviews", "product.back_in_stock", "product.data_health",
  ],
  sales: [
    "sales.orders.view", "sales.orders.manage", "sales.customers.view", "sales.customers.manage",
    "sales.quotes.view", "sales.quotes.manage", "sales.quotes.delete", "sales.quote_requests",
  ],
  purchase: [
    "purchase.suppliers.view", "purchase.suppliers.manage", "purchase.orders.view", "purchase.orders.manage",
    "purchase.orders.create_edit", "purchase.orders.approve", "purchase.orders.place", "purchase.orders.close", "purchase.orders.delete_unapproved",
    "purchase.receive_stock", "purchase.supplier_bills", "purchase.inventory", "purchase.stock_intelligence",
  ],
  accounting: [
    "accounting.dashboard", "accounting.invoices", "accounting.receivables", "accounting.payables", "accounting.bank_reconciliation",
    "accounting.accounts", "accounting.journals", "accounting.financial_statements", "accounting.cash_flow", "accounting.reports",
    "accounting.period_close", "accounting.year_end",
  ],
  administration: [
    "administration.chat", "administration.admin_accounts", "administration.security_groups", "administration.security_centre", "administration.storage_cleanup",
  ],
  business: [
    "business.ads", "business.freight", "business.pricing_levels", "business.abandoned_carts", "business.analytics", "business.reports",
    "business.marketing_seo", "business.google_shopping", "business.google_performance", "business.google_search", "business.google_api", "business.facebook",
  ],
} as const;

export type AdminSection = keyof typeof ADMIN_PERMISSION_GROUPS;
export type AdminPermission = typeof ADMIN_PERMISSION_GROUPS[AdminSection][number];
export type AdminPermissions = Record<string, boolean>;
export const ADMIN_SECTIONS = Object.keys(ADMIN_PERMISSION_GROUPS) as AdminSection[];
export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSION_GROUPS).flat() as readonly string[];
export const FULL_ADMIN_PERMISSIONS: AdminPermissions = Object.fromEntries(ALL_ADMIN_PERMISSIONS.map(k => [k, true]));

// Accepts the old section-level JSON too. This preserves every existing group's access
// when upgrading: e.g. { product:true } expands to every product.* permission.
export function normaliseAdminPermissions(value: any): AdminPermissions {
  const source = value && typeof value === "object" ? value : {};
  const out: AdminPermissions = {};
  for (const [section, keys] of Object.entries(ADMIN_PERMISSION_GROUPS)) {
    const legacyAll = source[section] === true;
    for (const key of keys) {
      const legacyPurchaseManage = section === "purchase" && ["purchase.orders.create_edit", "purchase.orders.approve", "purchase.orders.place", "purchase.orders.close", "purchase.orders.delete_unapproved"].includes(key) && source["purchase.orders.manage"] === true;
      out[key] = legacyAll || source[key] === true || legacyPurchaseManage;
    }
  }
  return out;
}

export function hasAdminPermission(permissions: AdminPermissions | null | undefined, permission: string | null): boolean {
  return !permission || permissions?.[permission] === true;
}

function readOrManage(method: string, view: string, manage: string) { return method === "GET" || method === "HEAD" ? view : manage; }

export function adminPermissionForRequest(pathname: string, method = "GET"): string | string[] | null {
  const p = String(pathname || "").split("?")[0].toLowerCase().replace(/^\/api/, "");
  const m = String(method || "GET").toUpperCase();

  // Intentionally permission-neutral endpoints used to establish the current admin session.
  if (p === "/admin/check" || p === "/admin/dashboard") return null;

  // Product
  if (/^\/admin\/products\/data-health(\/|$)/.test(p)) return "product.data_health";
  if (/^\/admin\/products\/stock-levels(\/|$)/.test(p)) return "product.stock";
  if (/^\/admin\/products\/.*\/pricing-override(\/|$)/.test(p) || /^\/admin\/products\/pricing-levels(\/|$)/.test(p)) return "product.pricing";
  if (/^\/admin\/products\/.*\/suppliers(\/|$)/.test(p) || /^\/admin\/products\/suppliers(\/|$)/.test(p)) return m === "GET" ? "purchase.suppliers.view" : "purchase.suppliers.manage";
  if (/^\/admin\/products\/.*\/(variants|addons)(\/|$)/.test(p)) return m === "GET" ? "product.view" : "product.edit";
  if (/^\/admin\/products\/.*\/duplicate(\/|$)/.test(p)) return "product.create";
  if (/^\/admin\/products\/upload-(image|download)(\/|$)/.test(p)) return "product.edit";
  if (/^\/admin\/products(\/|$)/.test(p)) {
    if (m === "POST") return "product.create";
    if (m === "DELETE") return "product.delete";
    if (m === "PUT" || m === "PATCH") return "product.edit";
    return "product.view";
  }
  if (/^\/admin\/categories(\/|$)/.test(p)) return "product.categories";
  if (/^\/admin\/reviews(\/|$)/.test(p)) return "product.reviews";
  if (/^\/admin\/back-in-stock(\/|$)/.test(p)) return "product.back_in_stock";
  if (/^\/admin\/inventory(\/|$)/.test(p)) return "product.stock";

  // Sales
  if (/^\/admin\/orders(\/|$)/.test(p)) return readOrManage(m, "sales.orders.view", "sales.orders.manage");
  if (/^\/admin\/customers(\/|$)/.test(p) || /^\/admin\/customer-login-users(\/|$)/.test(p)) return readOrManage(m, "sales.customers.view", "sales.customers.manage");
  if (/^\/admin\/manual-quotes(\/|$)/.test(p)) {
    if (m === "DELETE") return "sales.quotes.delete";
    return readOrManage(m, "sales.quotes.view", "sales.quotes.manage");
  }
  if (/^\/admin\/quotes(\/|$)/.test(p)) return "sales.quote_requests";

  // Purchasing endpoints (some intentionally live under /accounting in the existing project)
  if (/^\/admin\/accounting\/product-suppliers(\/|$)/.test(p) && m === "GET") return ["purchase.suppliers.view", "product.stocktake"];
  if (/^\/admin\/accounting\/store-products(\/|$)/.test(p) && m === "GET") return ["purchase.inventory", "product.stocktake"];
  if (/^\/admin\/accounting\/suppliers(\/|$)/.test(p) || /^\/admin\/accounting\/product-suppliers(\/|$)/.test(p) || /^\/admin\/accounting\/products-for-supplier(\/|$)/.test(p)) return readOrManage(m, "purchase.suppliers.view", "purchase.suppliers.manage");
  if (/^\/admin\/accounting\/stocktake(\/|$)/.test(p)) return "product.stocktake";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/receive(\/|$)/.test(p)) return "purchase.receive_stock";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/(submit-approval)(\/|$)/.test(p)) return "purchase.orders.create_edit";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/(approve)(\/|$)/.test(p)) return "purchase.orders.approve";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/(send|mark-ordered)(\/|$)/.test(p)) return "purchase.orders.place";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/(close)(\/|$)/.test(p)) return "purchase.orders.close";
  if (/^\/admin\/accounting\/purchase-orders\/[^/]+$/.test(p) && m === "DELETE") return "purchase.orders.delete_unapproved";
  if (/^\/admin\/accounting\/purchase-orders\/.*\/(bill)(\/|$)/.test(p)) return "purchase.supplier_bills";
  if (/^\/admin\/accounting\/purchase-orders(\/|$)/.test(p)) return readOrManage(m, "purchase.orders.view", "purchase.orders.create_edit");
  if (/^\/admin\/accounting\/supplier-(bills|payments)(\/|$)/.test(p)) return "purchase.supplier_bills";
  if (/^\/admin\/accounting\/inventory(\/|$)/.test(p) || /^\/admin\/accounting\/store-products(\/|$)/.test(p)) return "purchase.inventory";
  if (/^\/admin\/accounting\/stock-intelligence(\/|$)/.test(p)) return "purchase.stock_intelligence";
  if (/^\/admin\/purchasing\/suppliers(\/|$)/.test(p)) return readOrManage(m, "purchase.suppliers.view", "purchase.suppliers.manage");
  if (/^\/admin\/purchasing\/purchase-orders\/receive-stock(\/|$)/.test(p) || /^\/admin\/purchasing\/receive-stock(\/|$)/.test(p)) return "purchase.receive_stock";
  if (/^\/admin\/purchasing\/purchase-orders(\/|$)/.test(p)) return readOrManage(m, "purchase.orders.view", "purchase.orders.manage");
  if (/^\/admin\/purchasing\/supplier-bills(\/|$)/.test(p) || /^\/admin\/purchasing\/suppliers\/bills(\/|$)/.test(p)) return "purchase.supplier_bills";
  if (/^\/admin\/purchasing\/inventory(\/|$)/.test(p)) return "purchase.inventory";
  if (/^\/admin\/purchasing\/stock-intelligence(\/|$)/.test(p)) return "purchase.stock_intelligence";

  // Accounting
  if (/^\/admin\/accounting\/dashboard(\/|$)/.test(p) || p === "/admin/accounting") return "accounting.dashboard";
  if (/^\/admin\/accounting\/invoices(\/|$)/.test(p)) return "accounting.invoices";
  if (/^\/admin\/accounting\/customer-payments(\/|$)/.test(p) || /^\/admin\/accounting\/unposted-orders(\/|$)/.test(p)) return "accounting.receivables";
  if (/^\/admin\/accounting\/bank(\/|$)/.test(p)) return "accounting.bank_reconciliation";
  if (/^\/admin\/accounting\/accounts(\/|$)/.test(p)) return "accounting.accounts";
  if (/^\/admin\/accounting\/journals(\/|$)/.test(p)) return "accounting.journals";
  if (/^\/admin\/accounting\/(trial-balance|reports\/(balance-sheet|profit-loss|profit-loss-detailed))(\/|$)/.test(p)) return "accounting.financial_statements";
  if (/^\/admin\/accounting\/cash-flow(\/|$)/.test(p)) return "accounting.cash_flow";
  if (/^\/admin\/accounting\/(analytics|management-report|reports)(\/|$)/.test(p)) return "accounting.reports";
  if (/^\/admin\/accounting\/periods(\/|$)/.test(p)) return "accounting.period_close";
  if (/^\/admin\/accounting\/year-end(\/|$)/.test(p)) return "accounting.year_end";
  if (/^\/admin\/accounting(\/|$)/.test(p)) return "accounting.dashboard";

  // Administration
  if (/^\/admin\/chat(\/|$)/.test(p)) return "administration.chat";
  if (/^\/admin\/accounts(\/|$)/.test(p)) return "administration.admin_accounts";
  if (/^\/admin\/security-groups(\/|$)/.test(p)) return "administration.security_groups";
  if (/^\/admin\/security(\/|$)/.test(p)) return "administration.security_centre";
  if (/^\/admin\/storage-cleanup(\/|$)/.test(p)) return "administration.storage_cleanup";
  if (/^\/admin\/email\/test(\/|$)/.test(p)) return "administration.admin_accounts";

  // Business
  if (/^\/admin\/ads(\/|$)/.test(p)) return "business.ads";
  if (/^\/admin\/freight(\/|$)/.test(p)) return "business.freight";
  if (/^\/admin\/(pricing-levels|pricing)(\/|$)/.test(p)) return "business.pricing_levels";
  if (/^\/admin\/abandoned-carts(\/|$)/.test(p)) return "business.abandoned_carts";
  if (/^\/admin\/analytics(\/|$)/.test(p)) return "business.analytics";
  if (/^\/admin\/reports(\/|$)/.test(p)) return "business.reports";
  if (/^\/admin\/marketing-seo(\/|$)/.test(p)) return "business.marketing_seo";
  if (/^\/admin\/google-shopping(\/|$)/.test(p)) return "business.google_shopping";
  if (/^\/admin\/google-performance(\/|$)/.test(p)) return "business.google_performance";
  if (/^\/admin\/google-search(\/|$)/.test(p)) return "business.google_search";
  if (/^\/admin\/google-merchant-registration(\/|$)/.test(p)) return "business.google_api";
  if (/^\/admin\/facebook(\/|$)/.test(p)) return "business.facebook";
  // Fail closed for future /api/admin endpoints. A newly added admin API must be
  // deliberately mapped above before a restricted Admin can call it.
  if (p === "/admin" || p.startsWith("/admin/")) return "__unmapped_admin_route__";
  return null;
}

export function requestAdminPermission(event: H3Event): string | string[] | null {
  return adminPermissionForRequest(getRequestURL(event).pathname, getMethod(event));
}
