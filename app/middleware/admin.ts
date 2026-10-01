const adminPermissionForPath = (path: string): string | null => {
  const p = String(path || "").toLowerCase().split("?")[0];

  // Dashboard is available to every authenticated Admin account.
  if (p === "/admin" || p === "/admin/") return null;

  // Product
  if (/^\/admin\/products\/new(\/|$)/.test(p)) return "product.create";
  if (/^\/admin\/products\/stock-levels(\/|$)/.test(p)) return "product.stock";
  if (/^\/admin\/products\/reorder-centre(\/|$)/.test(p)) return "product.reorder";
  if (/^\/admin\/products\/stocktake(\/|$)/.test(p)) return "product.stocktake";
  if (/^\/admin\/products\/data-health(\/|$)/.test(p)) return "product.data_health";
  if (/^\/admin\/products\/[^/]+\/edit(\/|$)/.test(p)) return "product.edit";
  if (/^\/admin\/products(\/|$)/.test(p)) return "product.view";
  if (/^\/admin\/categories(\/|$)/.test(p)) return "product.categories";
  if (/^\/admin\/reviews(\/|$)/.test(p)) return "product.reviews";
  if (/^\/admin\/back-in-stock(\/|$)/.test(p)) return "product.back_in_stock";
  if (/^\/admin\/inventory(\/|$)/.test(p)) return "product.stock";

  // Sales
  if (/^\/admin\/orders(\/|$)/.test(p)) return "sales.orders.view";
  if (/^\/admin\/manual-quotes(\/|$)/.test(p)) return "sales.quotes.view";
  if (/^\/admin\/quotes(\/|$)/.test(p)) return "sales.quote_requests";
  if (/^\/admin\/customers(\/|$)/.test(p)) return "sales.customers.view";

  // Purchase
  if (/^\/admin\/purchasing\/purchase-orders\/receive-stock(\/|$)/.test(p) || /^\/admin\/purchasing\/receive-stock(\/|$)/.test(p)) return "purchase.receive_stock";
  if (/^\/admin\/purchasing\/purchase-orders\/new(\/|$)/.test(p)) return "purchase.orders.create_edit";
  if (/^\/admin\/purchasing\/purchase-orders(\/|$)/.test(p)) return "purchase.orders.view";
  if (/^\/admin\/purchasing\/suppliers\/bills(\/|$)/.test(p) || /^\/admin\/purchasing\/supplier-bills(\/|$)/.test(p)) return "purchase.supplier_bills";
  if (/^\/admin\/purchasing\/suppliers(\/|$)/.test(p) || /^\/admin\/suppliers(\/|$)/.test(p)) return "purchase.suppliers.view";
  if (/^\/admin\/purchasing\/inventory(\/|$)/.test(p)) return "purchase.inventory";
  if (/^\/admin\/purchasing\/stock-intelligence(\/|$)/.test(p)) return "purchase.stock_intelligence";

  // Accounting
  if (p === "/admin/accounting" || p === "/admin/accounting/") return "accounting.dashboard";
  if (/^\/admin\/accounting\/invoices(\/|$)/.test(p)) return "accounting.invoices";
  if (/^\/admin\/accounting\/receivables(\/|$)/.test(p)) return "accounting.receivables";
  if (/^\/admin\/accounting\/payables(\/|$)/.test(p)) return "accounting.payables";
  if (/^\/admin\/accounting\/bank-reconciliation(\/|$)/.test(p)) return "accounting.bank_reconciliation";
  if (/^\/admin\/accounting\/accounts(\/|$)/.test(p)) return "accounting.accounts";
  if (/^\/admin\/accounting\/journals(\/|$)/.test(p)) return "accounting.journals";
  if (/^\/admin\/accounting\/financial-statements(\/|$)/.test(p)) return "accounting.financial_statements";
  if (/^\/admin\/accounting\/cash-flow(\/|$)/.test(p)) return "accounting.cash_flow";
  if (/^\/admin\/accounting\/reports(\/|$)/.test(p)) return "accounting.reports";
  if (/^\/admin\/accounting\/period-close(\/|$)/.test(p)) return "accounting.period_close";
  if (/^\/admin\/accounting\/year-end-export(\/|$)/.test(p)) return "accounting.year_end";
  if (/^\/admin\/accounting(\/|$)/.test(p)) return "accounting.dashboard";

  // Administration
  if (/^\/admin\/chat(\/|$)/.test(p)) return "administration.chat";
  if (/^\/admin\/accounts(\/|$)/.test(p)) return "administration.admin_accounts";
  if (/^\/admin\/security-groups(\/|$)/.test(p)) return "administration.security_groups";
  if (/^\/admin\/security(\/|$)/.test(p)) return "administration.security_centre";
  if (/^\/admin\/storage-cleanup(\/|$)/.test(p)) return "administration.storage_cleanup";

  // Business
  if (/^\/admin\/ads(\/|$)/.test(p)) return "business.ads";
  if (/^\/admin\/freight(\/|$)/.test(p)) return "business.freight";
  if (/^\/admin\/pricing-levels(\/|$)/.test(p)) return "business.pricing_levels";
  if (/^\/admin\/abandoned-carts(\/|$)/.test(p)) return "business.abandoned_carts";
  if (/^\/admin\/analytics(\/|$)/.test(p)) return "business.analytics";
  if (/^\/admin\/reports(\/|$)/.test(p)) return "business.reports";
  if (/^\/admin\/marketing-seo(\/|$)/.test(p)) return "business.marketing_seo";
  if (/^\/admin\/google-shopping(\/|$)/.test(p)) return "business.google_shopping";
  if (/^\/admin\/google-performance(\/|$)/.test(p)) return "business.google_performance";
  if (/^\/admin\/google-search(\/|$)/.test(p)) return "business.google_search";
  if (/^\/admin\/google-merchant-registration(\/|$)/.test(p)) return "business.google_api";
  if (/^\/admin\/facebook-share(\/|$)/.test(p)) return "business.facebook";

  return null;
};

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const {
    checkAdmin,
    isAdmin,
    isSuperAdmin,
    adminChecked,
    checkingAdmin,
    adminPermissions,
    securityGroup,
  } = useAdminFetch();

  if (checkingAdmin.value) {
    let attempts = 0;
    while (checkingAdmin.value && attempts++ < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  if (!adminChecked.value) await checkAdmin();
  if (!isAdmin.value) return navigateTo("/");
  if (isSuperAdmin.value) return;

  // Existing Admins with no assigned security group retain the old full-access
  // behaviour. A security group switches the account to granular permissions.
  if (!securityGroup.value) return;

  const permission = adminPermissionForPath(to.path);
  if (permission && adminPermissions.value?.[permission] !== true) {
    return navigateTo("/admin?access=denied");
  }
});
