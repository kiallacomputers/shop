const adminSectionForPath = (path: string) => {
  const p = path.toLowerCase();
  if (/^\/admin\/(products|categories|reviews|back-in-stock|inventory)(\/|$)/.test(p)) return "product";
  if (/^\/admin\/(orders|manual-quotes|quotes|customers)(\/|$)/.test(p)) return "sales";
  if (/^\/admin\/(purchasing|suppliers)(\/|$)/.test(p)) return "purchase";
  if (/^\/admin\/accounting(\/|$)/.test(p)) return "accounting";
  if (/^\/admin\/(chat|accounts|security|security-groups|storage-cleanup)(\/|$)/.test(p)) return "administration";
  if (/^\/admin\/(ads|freight|pricing-levels|abandoned-carts|analytics|marketing-seo|google-shopping|google-performance|google-search|google-merchant-registration|reports|facebook-share)(\/|$)/.test(p)) return "business";
  return null;
};
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  const { checkAdmin, isAdmin, isSuperAdmin, adminChecked, checkingAdmin, adminPermissions } = useAdminFetch();
  if (checkingAdmin.value) {
    let attempts = 0; while (checkingAdmin.value && attempts++ < 50) await new Promise(r => setTimeout(r, 100));
  }
  if (!adminChecked.value) await checkAdmin();
  if (!isAdmin.value) return navigateTo("/");
  if (isSuperAdmin.value) return;
  const section = adminSectionForPath(to.path);
  if (section && adminPermissions.value?.[section] !== true) return navigateTo("/admin?access=denied");
});
