import { getQuery } from "h3";
import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const status = String(query.status || "all");
  const supabase = getAdminSupabase();

  let request = supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (status === "open" || status === "closed") request = request.eq("status", status);

  const { data, error } = await request;
  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to load chats." });
  return { conversations: data || [] };
});
