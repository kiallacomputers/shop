import { readBody } from "h3";
import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";
import { cleanChatMessage } from "~~/server/utils/chat";

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const id = String(event.context.params?.id || "");
  const body = await readBody(event);
  const message = cleanChatMessage(body?.message);
  if (!message) throw createError({ statusCode: 400, statusMessage: "Please enter a message." });

  const supabase = getAdminSupabase();
  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select("id,unread_customer")
    .eq("id", id)
    .maybeSingle();
  if (!conversation) throw createError({ statusCode: 404, statusMessage: "Chat not found." });

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: id,
      sender_type: "admin",
      sender_user_id: admin.id || admin.sub || null,
      message,
    })
    .select("*")
    .single();

  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to send reply." });

  await supabase
    .from("chat_conversations")
    .update({
      status: "open",
      unread_customer: Number(conversation.unread_customer || 0) + 1,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { message: data };
});
