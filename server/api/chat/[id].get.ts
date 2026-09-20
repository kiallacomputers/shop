import { getQuery } from "h3";
import { requireCustomerConversation } from "~~/server/utils/chat";

export default defineEventHandler(async (event) => {
  const id = String(event.context.params?.id || "");
  const query = getQuery(event);
  const token = typeof query.token === "string" ? query.token : "";

  const { supabase, conversation } = await requireCustomerConversation(event, id, token);
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id,sender_type,message,read_at,created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to load chat." });

  return {
    conversation: {
      id: conversation.id,
      status: conversation.status,
      customer_name: conversation.customer_name,
      customer_email: conversation.customer_email,
      unread_customer: conversation.unread_customer,
    },
    messages: messages || [],
  };
});
