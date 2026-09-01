import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export async function getRequestUser(event: H3Event) {
  // First try the normal Nuxt/Supabase server session.
  try {
    const user: any = await serverSupabaseUser(event);
    if (user?.id || user?.sub) return user;
  } catch {
    // Fall through to bearer-token authentication below.
  }

  // Netlify/serverless requests can occasionally lose the cookie-backed
  // Supabase session. Accept the authenticated browser's bearer token too.
  const authorization = getHeader(event, "authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) return null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function requireRequestUser(event: H3Event) {
  const user: any = await getRequestUser(event);
  const id = user?.id || user?.sub;

  if (!id) {
    throw createError({
      statusCode: 401,
      statusMessage: "You must be signed in.",
    });
  }

  return { ...user, id: String(id) };
}
