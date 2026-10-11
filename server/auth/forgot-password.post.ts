import { enforceRateLimit } from "~~/server/utils/rateLimit";
import { readBody } from "h3";
import { getAdminSupabase } from "../../utils/adminAuth";
import { sendPasswordRecoveryEmail } from "../../utils/authEmail";
import { assertAllowedKeys, rejectOversizedContentLength, requireEmail, requireObjectBody } from "~~/server/utils/inputValidation";

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "auth-recovery",
    max: 5,
    windowSeconds: 3600,
  });
  rejectOversizedContentLength(event, 8 * 1024);
  const body = requireObjectBody(await readBody(event));
  assertAllowedKeys(body, ["email"]);
  const email = requireEmail(body.email);

  const config = useRuntimeConfig();
  const siteUrl = String(config.public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/+$/, "");
  const supabase = getAdminSupabase();

  // Always return a generic success response for unknown addresses.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) {
    console.warn("GRAPH PASSWORD RECOVERY GENERATE LINK:", error.message);
    return { ok: true };
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    console.warn("GRAPH PASSWORD RECOVERY: Supabase returned no hashed token.");
    return { ok: true };
  }

  const recoveryUrl =
    `${siteUrl}/auth/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;

  try {
    await sendPasswordRecoveryEmail({ email, recoveryUrl });
  } catch (mailError) {
    console.error("GRAPH PASSWORD RECOVERY EMAIL ERROR:", mailError);
    // Keep the public response generic to avoid exposing account existence.
  }

  return { ok: true };
});
