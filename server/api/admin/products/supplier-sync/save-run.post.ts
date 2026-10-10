import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
 await requireAdmin(event);
 const body=await readBody(event); const raw=body?.results;
 if(!Array.isArray(raw)||raw.length===0||raw.length>10000)throw createError({statusCode:400,statusMessage:"Invalid sync results"});
 const db=getAdminSupabase(); const now=new Date().toISOString();
 const checked=raw.length,changed=raw.filter((r:any)=>r.status==='ok'&&r.changed).length,failed=raw.filter((r:any)=>r.status!=='ok').length;
 const {data:run,error:runError}=await db.from('supplier_sync_runs').insert({supplier_name:'Leader Systems',started_at:now,completed_at:now,status:body.complete?(failed?'completed_with_errors':'completed'):'partial',checked_count:checked,changed_count:changed,failed_count:failed}).select('id').single();
 if(runError||!run)throw createError({statusCode:500,statusMessage:runError?.message||'Could not save sync run'});
 const records=raw.map((r:any)=>({run_id:run.id,product_id:Number(r.product_id)||null,variant_id:Number(r.variant_id)||null,product_name:String(r.name||'').slice(0,500),sku:String(r.sku||'').slice(0,150),status:String(r.status||'unknown').slice(0,40),error_message:r.error?String(r.error).slice(0,2000):null,changed:Boolean(r.changed)}));
 for(let i=0;i<records.length;i+=200){const {error}=await db.from('supplier_sync_results').insert(records.slice(i,i+200));if(error)throw createError({statusCode:500,statusMessage:`Run saved but details failed: ${error.message}`});}
 return {run_id:run.id,checked,changed,failed};
});
