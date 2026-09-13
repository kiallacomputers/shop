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
