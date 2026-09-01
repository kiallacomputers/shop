import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

const states = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export default defineEventHandler(async (event) => {
  const user: any = await serverSupabaseUser(event);

  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: "You must be signed in." });
  }

  const body = await readBody(event);
  const fullName = clean(body?.full_name);
  const address1 = clean(body?.address_line_1);
  const address2 = clean(body?.address_line_2) || null;
  const suburb = clean(body?.suburb);
  const state = clean(body?.state).toUpperCase();
  const postcode = clean(body?.postcode);
  const label = clean(body?.label) || null;
  const phone = clean(body?.phone) || null;

  if (!fullName || !address1 || !suburb) {
    throw createError({ statusCode: 400, statusMessage: "Name, street address and suburb are required." });
  }
  if (!states.has(state)) {
    throw createError({ statusCode: 400, statusMessage: "Please select a valid Australian state or territory." });
  }
  if (!/^\d{4}$/.test(postcode)) {
    throw createError({ statusCode: 400, statusMessage: "Postcode must contain exactly 4 numbers." });
  }

  const supabase = getAdminSupabase();
  const userId = String(user.id);

  const { count, error: countError } = await supabase
    .from("customer_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw createError({ statusCode: 500, statusMessage: countError.message });
  }

  const makePrimary = body?.is_primary === true || Number(count || 0) === 0;

  if (makePrimary) {
    const { error } = await supabase
      .from("customer_addresses")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_primary", true);

    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      user_id: userId,
      label,
      full_name: fullName,
      address_line_1: address1,
      address_line_2: address2,
      suburb,
      state,
      postcode,
      country: "AU",
      phone,
      is_primary: makePrimary,
    })
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return data;
});
