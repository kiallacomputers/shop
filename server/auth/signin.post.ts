import { createClient } from "@supabase/supabase-js";
import { readBody } from "h3";
import { enforceRateLimit } from "~~/server/utils/rateLimit";
import { writeSecurityAudit } from "~~/server/utils/securityAudit";
import {
  assertAllowedKeys,
  rejectOversizedContentLength,
  requireEmail,
  requireObjectBody,
} from "~~/server/utils/inputValidation";

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    bucket: "auth-signin",
    max: 10,
    windowSeconds: 15 * 60,
  });

  rejectOversizedContentLength(event, 8 * 1024);
  const body = requireObjectBody(await readBody(event));
  assertAllowedKeys(body, ["email", "password"]);

  const email = requireEmail(body.email);
  const password = String(body.password || "");
  if (!password || password.length > 128) {
    throw createError({ statusCode: 422, statusMessage: "Email or password is incorrect." });
  }

  const config = useRuntimeConfig(event);
  const supabaseUrl = String(config.public?.supabaseUrl || process.env.SUPABASE_URL || "");
  const supabaseAnonKey = String(config.public?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || "");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw createError({ statusCode: 500, statusMessage: "Authentication is not configured." });
  }

  const auth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const maskEmail = (value: string) => {
    const [local, domain] = value.split("@");
    if (!local || !domain) return "Customer / User";
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(3, Math.min(8, local.length - visible)))}@${domain}`;
  };

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    await writeSecurityAudit(event, {
      action: "auth.signin",
      outcome: "denied",
      severity: "warning",
      resource: "/api/auth/signin",
      actorEmail: maskEmail(email),
      details: { reason: "invalid_credentials", actor_type: "customer" },
    });
    throw createError({ statusCode: 401, statusMessage: "Email or password is incorrect." });
  }

  await writeSecurityAudit(event, {
    action: "auth.signin",
    outcome: "success",
    severity: "info",
    resource: "/api/auth/signin",
    actorId: data.user.id,
    actorEmail: data.user.email || email,
    details: { actor_type: "customer" },
  });

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  };
});
