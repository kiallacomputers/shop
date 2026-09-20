import { readBody, getRequestURL } from "h3";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { cleanChatMessage, getOptionalUser, hashChatToken, newChatToken } from "~~/server/utils/chat";
import { notifyAdminsOfChat } from "~~/server/utils/chatPush";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const message = cleanChatMessage(body?.message);
  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Please enter a message." });
  }

  const user = await getOptionalUser(event);
  const userId = user?.id || user?.sub || null;
  const email = String(body?.email || user?.email || "").trim().toLowerCase().slice(0, 320);
  const name = String(body?.name || user?.user_metadata?.display_name || "").trim().slice(0, 160);

  if (!userId && (!email || !email.includes("@"))) {
    throw createError({ statusCode: 400, statusMessage: "Please enter a valid email address." });
  }

  const token = newChatToken();
  const supabase = getAdminSupabase();
  const { data: conversation, error } = await supabase
    .from("chat_conversations")
    .insert({
      customer_user_id: userId,
      visitor_token_hash: hashChatToken(token),
      customer_name: name || null,
      customer_email: email || null,
      page_url: String(body?.pageUrl || "").slice(0, 1000) || null,
      page_title: String(body?.pageTitle || "").slice(0, 300) || null,
      unread_admin: 1,
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !conversation) {
    console.error("CHAT START ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to start chat." });
  }

  const { data: firstMessage, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversation.id,
      sender_type: "customer",
      sender_user_id: userId,
      message,
    })
    .select("*")
    .single();

  if (messageError) {
    await supabase.from("chat_conversations").delete().eq("id", conversation.id);
    throw createError({ statusCode: 500, statusMessage: "Unable to send message." });
  }

  notifyAdminsOfChat({
    conversationId: conversation.id,
    customerName: name || email || "Customer",
    customerEmail: email || null,
    message,
  }).catch((error) => console.error("CHAT PUSH ERROR:", error));

  return {
    conversation: {
      id: conversation.id,
      status: conversation.status,
      customer_name: conversation.customer_name,
      customer_email: conversation.customer_email,
    },
    token,
    messages: [firstMessage],
  };
});
