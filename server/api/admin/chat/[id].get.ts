import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = String(event.context.params?.id || "");
  const supabase = getAdminSupabase();

  const [{ data: conversation, error: conversationError }, { data: messages, error: messageError }] =
    await Promise.all([
      supabase.from("chat_conversations").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (conversationError || !conversation) {
    throw createError({ statusCode: 404, statusMessage: "Chat not found." });
  }
  if (messageError) throw createError({ statusCode: 500, statusMessage: "Unable to load messages." });

  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("chat_conversations").update({ unread_admin: 0, updated_at: now }).eq("id", id),
    supabase
      .from("chat_messages")
      .update({ read_at: now })
      .eq("conversation_id", id)
      .eq("sender_type", "customer")
      .is("read_at", null),
  ]);

  return { conversation: { ...conversation, unread_admin: 0 }, messages: messages || [] };
});
