import { createHash, randomBytes } from "node:crypto";
import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { getAdminSupabase } from "~~/server/utils/adminAuth";

export const newChatToken = () => randomBytes(32).toString("base64url");
export const hashChatToken = (token: string) =>
  createHash("sha256").update(String(token || "")).digest("hex");

export const cleanChatMessage = (value: unknown) =>
  String(value || "").trim().slice(0, 4000);

export const getOptionalUser = async (event: H3Event) => {
  try {
    return await serverSupabaseUser(event);
  } catch {
    return null;
  }
};

export async function requireCustomerConversation(
  event: H3Event,
  conversationId: string,
  token?: string | null,
) {
  const supabase = getAdminSupabase();
  const { data: conversation, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !conversation) {
    throw createError({ statusCode: 404, statusMessage: "Chat conversation not found." });
  }

  const user = await getOptionalUser(event);
  const userId = user?.id || user?.sub || null;
  const validUser =
    Boolean(userId) &&
    Boolean(conversation.customer_user_id) &&
    String(conversation.customer_user_id) === String(userId);

  const cleanToken = String(token || "").trim();
  const validToken =
    Boolean(cleanToken) &&
    Boolean(conversation.visitor_token_hash) &&
    hashChatToken(cleanToken) === conversation.visitor_token_hash;

  if (!validUser && !validToken) {
    throw createError({ statusCode: 403, statusMessage: "Chat access denied." });
  }

  return { supabase, conversation, user, userId };
}
