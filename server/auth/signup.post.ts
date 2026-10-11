import { enforceRateLimit } from "~~/server/utils/rateLimit";
import { readBody } from "h3";
import { getAdminSupabase } from "../../utils/adminAuth";
import { sendSignupVerificationEmail } from "../../utils/authEmail";
import { assertAllowedKeys, cleanInputText, rejectOversizedContentLength, requireEmail, requireObjectBody } from "~~/server/utils/inputValidation";

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "auth-signup",
    max: 5,
    windowSeconds: 3600,
  });
  rejectOversizedContentLength(event, 16 * 1024);
  const body = requireObjectBody(await readBody(event));
  assertAllowedKeys(body, ["email", "password", "fullName"]);
  const email = requireEmail(body.email);
  const password = String(body.password || "");
  const fullName = cleanInputText(body.fullName, 120);

  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 422, statusMessage: "Password must be between 8 and 128 characters." });
  }
  if (!fullName) {
    throw createError({ statusCode: 422, statusMessage: "Your name is required." });
  }

  const config = useRuntimeConfig();
  const siteUrl = String(config.public.siteUrl || "https://shop.kiallacomputers.com.au").replace(/\/+$/, "");
  const supabase = getAdminSupabase();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: { display_name: fullName },
    },
  });

  if (error) {
    console.error("GRAPH SIGNUP GENERATE LINK ERROR:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Unable to create this account. If you already have an account, try signing in or resetting your password.",
    });
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    throw createError({ statusCode: 500, statusMessage: "Unable to create the verification link." });
  }

  const verificationUrl =
    `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=signup`;

  // Keep the website login and sales/customer record connected. Existing manual
  // customers are matched by a unique email; otherwise create the customer profile.
  const newUserId = String(data?.user?.id || "");
  let createdSalesCustomerId: string | number | null = null;
  if (newUserId) {
    const { data: matches, error: lookupError } = await supabase
      .from("sales_customers")
      .select("id,auth_user_id,pricing_level_key")
      .ilike("email", email);

    if (lookupError) {
      console.error("CUSTOMER LINK LOOKUP ERROR:", lookupError);
    } else if ((matches || []).length > 1) {
      console.warn(`CUSTOMER LINK SKIPPED: multiple sales_customers rows use ${email}`);
    } else if (matches?.length === 1) {
      const customer: any = matches[0];
      if (!customer.auth_user_id || String(customer.auth_user_id) === newUserId) {
        const { error: linkError } = await supabase.from("sales_customers")
          .update({ auth_user_id: newUserId, updated_at: new Date().toISOString() })
          .eq("id", customer.id);
        if (linkError) console.error("CUSTOMER LINK UPDATE ERROR:", linkError);
        if (customer.pricing_level_key) {
          const { error: pricingError } = await supabase.from("customer_pricing_assignments").upsert({
            user_id: newUserId, pricing_level_key: customer.pricing_level_key, updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          if (pricingError) console.error("CUSTOMER PRICING LINK ERROR:", pricingError);
        }
      }
    } else {
      const { data: created, error: createErrorValue } = await supabase.from("sales_customers").insert({
        customer_type: "individual", pricing_level_key: "standard", full_name: fullName, email,
        auth_user_id: newUserId, processing_fee_enabled: true,
      }).select("id").single();
      if (createErrorValue) console.error("CUSTOMER PROFILE CREATE ERROR:", createErrorValue);
      else createdSalesCustomerId = created?.id ?? null;
    }
  }

  try {
    await sendSignupVerificationEmail({
      email,
      name: fullName,
      verificationUrl,
    });
  } catch (mailError) {
    console.error("GRAPH SIGNUP EMAIL ERROR:", mailError);
    // Delete the unconfirmed account so the customer can retry cleanly.
    const userId = data?.user?.id;
    if (userId) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        if (createdSalesCustomerId != null) {
          await supabase.from("sales_customers").delete().eq("id", createdSalesCustomerId).eq("auth_user_id", userId);
        } else {
          await supabase.from("sales_customers").update({ auth_user_id: null, updated_at: new Date().toISOString() }).eq("auth_user_id", userId);
        }
      } catch (cleanupError) {
        console.error("SIGNUP CLEANUP ERROR:", cleanupError);
      }
    }
    throw createError({
      statusCode: 502,
      statusMessage: "Your account could not be created because the verification email could not be sent. Please try again.",
    });
  }

  return {
    ok: true,
    message: "Account created. Check your email to confirm your account before signing in.",
  };
});
