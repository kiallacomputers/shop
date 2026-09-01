import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

const states = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
const clean = (value: unknown) => String(value ?? "").trim();

export default defineEventHandler(async (event) => {
  const user: any = await serverSupabaseUser(event);
  if (!user?.id) throw createError({ statusCode: 401, statusMessage: "You must be signed in." });

  const id = getRouterParam(event, "id");
  if (!id || !/^\d+$/.test(id)) throw createError({ statusCode: 400, statusMessage: "Invalid address ID." });

  const body = await readBody(event);
  const fullName = clean(body?.full_name);
  const address1 = clean(body?.address_line_1);
  const address2 = clean(body?.address_line_2) || null;
  const suburb = clean(body?.suburb);
  const state = clean(body?.state).toUpperCase();
  const postcode = clean(body?.postcode);
  const label = clean(body?.label) || null;
  const phone = clean(body?.phone) || null;

  if (!fullName || !address1 || !suburb) throw createError({ statusCode: 400, statusMessage: "Name, street address and suburb are required." });
  if (!states.has(state)) throw createError({ statusCode: 400, statusMessage: "Please select a valid Australian state or territory." });
  if (!/^\d{4}$/.test(postcode)) throw createError({ statusCode: 400, statusMessage: "Postcode must contain exactly 4 numbers." });

  const supabase = getAdminSupabase();
  const userId = String(user.id);

  const { data: existing, error: existingError } = await supabase
    .from("customer_addresses")
    .select("id, is_primary")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw createError({ statusCode: 500, statusMessage: existingError.message });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Address not found." });

  const makePrimary = body?.is_primary === true;

  if (makePrimary) {
    const { error } = await supabase
      .from("customer_addresses")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("id", id)
      .eq("is_primary", true);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // Do not allow the only primary to be unset without another address becoming primary.
  const isPrimary = existing.is_primary && !makePrimary ? true : makePrimary;

  const { data, error } = await supabase
    .from("customer_addresses")
    .update({
      label,
      full_name: fullName,
      address_line_1: address1,
      address_line_2: address2,
      suburb,
      state,
      postcode,
      country: "AU",
      phone,
      is_primary: isPrimary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
