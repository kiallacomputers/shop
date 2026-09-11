import { serverSupabaseUser } from "#supabase/server";
import { getStorePickupOption } from "~~/server/utils/freight";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "You must be signed in to view pickup options." });
  }

  return await getStorePickupOption();
});
