import { getAdminSupabase } from "~~/server/utils/adminAuth";
export const ABANDONED_AFTER_MINUTES = 60;
export async function refreshAbandonedCartStatuses() {
  const supabase=getAdminSupabase();
  const cutoff=new Date(Date.now()-ABANDONED_AFTER_MINUTES*60_000).toISOString();
  await supabase.from('abandoned_carts').update({status:'abandoned',abandoned_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('status','active').lt('last_activity_at',cutoff);
}
