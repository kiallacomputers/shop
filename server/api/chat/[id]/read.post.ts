import { readBody } from "h3";
import { requireCustomerConversation } from "~~/server/utils/chat";

export default defineEventHandler(async (event) => {
  const id = String(event.context.params?.id || "");
  const body = await readBody(event);
  const { supabase } = await requireCustomerConversation(event, id, String(body?.token || ""));
  const now = new Date().toISOString();

  await Promise.all([
    supabase.from("chat_conversations").update({ unread_customer: 0, updated_at: now }).eq("id", id),
    supabase
      .from("chat_messages")
      .update({ read_at: now })
      .eq("conversation_id", id)
      .eq("sender_type", "admin")
      .is("read_at", null),
  ]);

  return { ok: true };
});
