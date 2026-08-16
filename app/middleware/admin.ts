export default defineNuxtRouteMiddleware(async () => {
  const { checkAdmin, isAdmin, adminChecked } = useAdminFetch();

  if (!adminChecked.value) {
    await checkAdmin();
  }

  if (!isAdmin.value) {
    return navigateTo("/");
  }
});
