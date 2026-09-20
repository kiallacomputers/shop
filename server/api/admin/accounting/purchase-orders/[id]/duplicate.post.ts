import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { purchaseTotals } from "~~/server/utils/accountingPurchases";
export default defineEventHandler(async event=>{
  await requireSuperAdmin(event); const id=Number(getRouterParam(event,"id")); const s=getAdminSupabase();
  const {data:src,error}=await s.from("accounting_purchase_orders").select("*,accounting_purchase_order_lines(*)").eq("id",id).single();
  if(error||!src) throw createError({statusCode:404,statusMessage:"Purchase order not found."});
  const lines=(src.accounting_purchase_order_lines||[]).map((x:any)=>({product_id:x.product_id||null,description:x.description,sku:x.sku||null,quantity:Number(x.quantity||1),unit_cost_ex_gst:Number(x.unit_cost_ex_gst||0)}));
  const totals=purchaseTotals(lines); const today=new Date().toISOString().slice(0,10);
  const {data:po,error:ie}=await s.from("accounting_purchase_orders").insert({supplier_id:src.supplier_id,order_date:today,expected_date:null,status:"draft",supplier_reference:null,notes:src.notes||null,...totals}).select().single();
  if(ie||!po) throw createError({statusCode:400,statusMessage:ie?.message||"Unable to duplicate purchase order."});
  const rows=lines.map((x:any,n:number)=>{const ex=Math.round(x.quantity*x.unit_cost_ex_gst*100)/100;return{purchase_order_id:po.id,...x,gst_amount:Math.round(ex*.1*100)/100,line_total:Math.round(ex*1.1*100)/100,sort_order:n}});
  const {error:le}=await s.from("accounting_purchase_order_lines").insert(rows); if(le) throw createError({statusCode:500,statusMessage:le.message}); return po;
});
