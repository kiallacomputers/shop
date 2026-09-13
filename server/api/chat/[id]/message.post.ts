import { readBody } from "h3";
import { cleanChatMessage, requireCustomerConversation } from "~~/server/utils/chat";
import { notifyAdminsOfChat } from "~~/server/utils/chatPush";

export default defineEventHandler(async (event) => {
  const id = String(event.context.params?.id || "");
  const body = await readBody(event);
  const message = cleanChatMessage(body?.message);
  if (!message) throw createError({ statusCode: 400, statusMessage: "Please enter a message." });

  const { supabase, conversation, userId } =
    await requireCustomerConversation(event, id, String(body?.token || ""));

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: id,
      sender_type: "customer",
      sender_user_id: userId,
      message,
    })
    .select("*")
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to send message." });

  await supabase
    .from("chat_conversations")
    .update({
      status: "open",
      unread_admin: Number(conversation.unread_admin || 0) + 1,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  notifyAdminsOfChat({
    conversationId: id,
    customerName: conversation.customer_name || conversation.customer_email || "Customer",
    customerEmail: conversation.customer_email || null,
    message,
  }).catch((error) => console.error("CHAT PUSH ERROR:", error));

  return { message: data };
});
