import { postManualQuoteToAccounting } from "~~/server/utils/manualQuoteAccounting";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { enforceRateLimit } from "~~/server/utils/rateLimit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "public-quote-respond",
    max: 10,
    windowSeconds: 15 * 60,
  });

  const token = String(getRouterParam(event, "token") || "").trim();

  if (!UUID_PATTERN.test(token)) {
    throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  }

  const body = await readBody(event);
  const response = String(body?.response || "").toLowerCase();

  if (!["accepted", "declined"].includes(response)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please choose Accept or Decline.",
    });
  }

  const s = getAdminSupabase();
  const { data: q, error } = await s
    .from("manual_quotes")
    .select("id,status,expires_at")
    .eq("public_token", token)
    .maybeSingle();

  if (error || !q) {
    throw createError({ statusCode: 404, statusMessage: "Quote not found." });
  }

  if (["accepted", "declined", "converted"].includes(String(q.status))) {
    throw createError({
      statusCode: 409,
      statusMessage: "This quote has already been responded to.",
    });
  }

  if (
    q.expires_at &&
    new Date(String(q.expires_at) + "T23:59:59") < new Date()
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "This quote has expired. Please contact Kialla Computers.",
    });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await s
    .from("manual_quotes")
    .update({
      status: response,
      customer_responded_at: now,
      customer_response_note:
        String(body?.note || "").trim().slice(0, 1000) || null,
      accepted_at: response === "accepted" ? now : null,
      updated_at: now,
    })
    .eq("id", q.id);

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message });
  }

  if (response === "accepted") {
    try {
      await postManualQuoteToAccounting(Number(q.id));
    } catch (error: any) {
      console.error(
        "Unable to post accepted manual quote to accounting:",
        error?.message || error,
      );
    }
  }

  return { ok: true, status: response };
});
