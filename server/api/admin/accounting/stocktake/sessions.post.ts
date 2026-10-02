import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const user:any = await requireAdmin(event);
  const body = await readBody(event);
  const s = getAdminSupabase();
  const { data: products, error: pe } = await s.from("products")
    .select("id,name,product_code,stock,buy_price_ex_gst,landed_cost_ex_gst,active")
    .eq("active", true).order("name");
  if (pe) throw createError({statusCode:500,statusMessage:pe.message});
  if (!(products||[]).length) throw createError({statusCode:400,statusMessage:"There are no active products to count."});
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
  const number = `ST-${stamp}`;
  const { data: st, error: se } = await s.from("accounting_stocktakes").insert({
    stocktake_number:number, status:"open", reference:String(body?.reference||number).trim(),
    notes:String(body?.notes||"").trim()||null, created_by:user?.id||user?.sub||null
  }).select().single();
  if(se||!st) throw createError({statusCode:500,statusMessage:se?.message||"Unable to create stocktake."});
  const lines=(products||[]).map((p:any)=>({stocktake_id:st.id,product_id:p.id,system_quantity:Number(p.stock||0),unit_cost_ex_gst:Number((p.landed_cost_ex_gst ?? p.buy_price_ex_gst)||0)}));
  const {error:le}=await s.from("accounting_stocktake_lines").insert(lines);
  if(le){await s.from("accounting_stocktakes").delete().eq("id",st.id);throw createError({statusCode:500,statusMessage:le.message});}
  return {ok:true,id:st.id,stocktake_number:number,products:lines.length};
});
