export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return navigateTo("/auth/signin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return navigateTo("/");
  }
});
