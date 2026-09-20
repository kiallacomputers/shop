import { readBody } from "h3";
import { getAdminSupabase } from "../../utils/adminAuth";
import { sendSignupVerificationEmail } from "../../utils/authEmail";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const fullName = String(body?.fullName || "").trim();

  if (!email || !email.includes("@")) {
    throw createError({ statusCode: 400, statusMessage: "A valid email address is required." });
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." });
  }
  if (!fullName) {
    throw createError({ statusCode: 400, statusMessage: "Your name is required." });
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

  // If this email already belongs to a manually-created sales customer,
  // link the new website account automatically. Email is the identity key.
  const newUserId = String(data?.user?.id || "");
  if (newUserId) {
    const { data: manualCustomers, error: manualCustomerError } = await supabase
      .from("sales_customers")
      .select("id,user_id,pricing_level_key")
      .ilike("email", email);

    if (manualCustomerError) {
      console.error("MANUAL CUSTOMER LINK LOOKUP ERROR:", manualCustomerError);
    } else if ((manualCustomers || []).length > 1) {
      console.warn(`MANUAL CUSTOMER LINK SKIPPED: multiple sales_customers rows use ${email}`);
    } else {
      const manualCustomer: any = manualCustomers?.[0];
      if (manualCustomer && (!manualCustomer.user_id || String(manualCustomer.user_id) === newUserId)) {
        const { error: linkError } = await supabase
          .from("sales_customers")
          .update({ user_id: newUserId, updated_at: new Date().toISOString() })
          .eq("id", manualCustomer.id)
          .or(`user_id.is.null,user_id.eq.${newUserId}`);
        if (linkError) {
          console.error("MANUAL CUSTOMER LINK UPDATE ERROR:", linkError);
        }

        // Carry the manual customer's chosen website pricing level into
        // their signed-in storefront account as well.
        if (manualCustomer.pricing_level_key) {
          const { error: pricingError } = await supabase
            .from("customer_pricing_assignments")
            .upsert({
              user_id: newUserId,
              pricing_level_key: manualCustomer.pricing_level_key,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
          if (pricingError) console.error("MANUAL CUSTOMER PRICING LINK ERROR:", pricingError);
        }
      }
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
