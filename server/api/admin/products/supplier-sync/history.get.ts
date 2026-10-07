import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async(event)=>{await requireAdmin(event);const s=getAdminSupabase(),q=getQuery(event),runId=Number(q.run_id)||0;
 const {data:runs,error}=await s.from("supplier_sync_runs").select("*").eq("supplier_name","Leader Systems").order("started_at",{ascending:false}).limit(20);if(error)throw createError({statusCode:500,statusMessage:`Unable to load sync history: ${error.message}. Run the supplied SQL migration first.`});
 let results:any[]=[];if(runId){const x=await s.from("supplier_sync_results").select("*").eq("run_id",runId).order("id",{ascending:true});if(x.error)throw createError({statusCode:500,statusMessage:x.error.message});results=x.data||[]}
 return {runs:runs||[],results};});
