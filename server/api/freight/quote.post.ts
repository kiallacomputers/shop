
import { serverSupabaseUser } from "#supabase/server";
import { calculateFreightOptions } from "~~/server/utils/freight";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "You must be signed in to calculate delivery.",
    });
  }

  const body = await readBody(event);

  return await calculateFreightOptions({
    items: body?.items,
    postcode: body?.postcode,
  });
});
