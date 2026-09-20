import { readBody } from "h3";
import { requireAdmin, getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = String(event.context.params?.id || "");
  const body = await readBody(event);
  const status = String(body?.status || "");
  if (!["open", "closed"].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid chat status." });
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("chat_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to update chat." });
  return { ok: true, status };
});
