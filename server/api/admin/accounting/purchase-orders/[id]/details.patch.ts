import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async event => {
  await requireSuperAdmin(event);
  const id=Number(getRouterParam(event,"id")); const body=await readBody(event); if(!id) throw createError({statusCode:400,statusMessage:"Invalid purchase order."});
  const patch:any={updated_at:new Date().toISOString()};
  if(Object.prototype.hasOwnProperty.call(body,"supplier_reference")) patch.supplier_reference=body.supplier_reference||null;
  if(Object.prototype.hasOwnProperty.call(body,"expected_date")) patch.expected_date=body.expected_date||null;
  if(Object.prototype.hasOwnProperty.call(body,"notes")) patch.notes=body.notes||null;
  const {data,error}=await getAdminSupabase().from("accounting_purchase_orders").update(patch).eq("id",id).select().single();
  if(error||!data) throw createError({statusCode:400,statusMessage:error?.message||"Unable to update purchase order."}); return data;
});
