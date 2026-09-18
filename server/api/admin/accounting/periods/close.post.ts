import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async(event)=>{
 const user:any=await requireSuperAdmin(event), b=await readBody(event), from=String(b?.start_date||""),to=String(b?.end_date||""),name=String(b?.name||"").trim();
 if(!name||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)throw createError({statusCode:400,statusMessage:"Name and valid period dates are required."});
 const s=getAdminSupabase();
 const {data:overlap,error:oe}=await s.from("accounting_periods").select("id,name,status").lte("start_date",to).gte("end_date",from).neq("status","reopened");
 if(oe)throw createError({statusCode:500,statusMessage:oe.message}); if(overlap?.length)throw createError({statusCode:409,statusMessage:`This range overlaps '${(overlap[0] as any).name}'.`});
 const {data:unp,error:ue}=await s.from("accounting_journals").select("id").gte("journal_date",from).lte("journal_date",to).neq("status","posted").limit(1);if(ue)throw createError({statusCode:500,statusMessage:ue.message});if(unp?.length)throw createError({statusCode:409,statusMessage:"The period contains unposted journals. Post or resolve them before closing."});
 const now=new Date().toISOString(),uid=String(user?.id||user?.sub||"")||null;
 const {data:p,error}=await s.from("accounting_periods").insert({name,start_date:from,end_date:to,period_type:String(b?.period_type||"custom"),status:"closed",closed_at:now,closed_by:uid,notes:b?.notes||null}).select().single();if(error)throw createError({statusCode:500,statusMessage:error.message});
 await s.from("accounting_period_audit").insert({period_id:p.id,action:"closed",action_by:uid,notes:b?.notes||null});return p;
});
