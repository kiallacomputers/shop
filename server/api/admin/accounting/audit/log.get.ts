import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const q=getQuery(event); const limit=Math.min(200,Math.max(10,Number(q.limit||100)));
  const s=getAdminSupabase();
  const {data,error}=await s.from("accounting_audit_log").select("id,created_at,table_name,record_id,action,old_data,new_data,actor_user_id,note").order("created_at",{ascending:false}).limit(limit);
  if(error){
    if(["42P01","PGRST205"].includes(String((error as any).code||""))) return {items:[],not_installed:true};
    throw createError({statusCode:500,statusMessage:error.message});
  }
  return {items:data||[],not_installed:false};
});
