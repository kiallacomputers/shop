import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { postSupplierBill } from "~~/server/utils/accountingPurchases";
export default defineEventHandler(async (event) => {
  const user:any=await requireSuperAdmin(event); const id=Number(getRouterParam(event,"id")); const body=await readBody(event); const s=getAdminSupabase();
  if(!id) throw createError({statusCode:400,statusMessage:"Invalid purchase order."});
  const {data:existing}=await s.from("accounting_supplier_bills").select("id,bill_number").eq("purchase_order_id",id).maybeSingle();
  if(existing) throw createError({statusCode:409,statusMessage:`${existing.bill_number} already exists for this purchase order.`});
  const {data:po,error}=await s.from("accounting_purchase_orders").select("*,accounting_purchase_order_lines(*)").eq("id",id).single();
  if(error||!po) throw createError({statusCode:404,statusMessage:"Purchase order not found."});
  const lines=po.accounting_purchase_order_lines||[]; if(!lines.length) throw createError({statusCode:400,statusMessage:"Purchase order has no lines."});
  const {data:bill,error:be}=await s.from("accounting_supplier_bills").insert({supplier_id:po.supplier_id,purchase_order_id:po.id,supplier_invoice_number:body?.supplier_invoice_number||po.supplier_reference||null,bill_date:body?.bill_date||new Date().toISOString().slice(0,10),due_date:body?.due_date||null,status:"draft",subtotal:po.subtotal,gst_amount:po.gst_amount,total:po.total}).select().single();
  if(be||!bill) throw createError({statusCode:400,statusMessage:be?.message||"Unable to create supplier bill."});
  const rows=lines.map((x:any,n:number)=>({bill_id:bill.id,product_id:x.product_id||null,account_id:null,description:x.description,sku:x.sku||null,quantity:Number(x.quantity),unit_cost_ex_gst:Number(x.unit_cost_ex_gst),gst_amount:Number(x.gst_amount||0),line_total:Number(x.line_total||0),sort_order:n}));
  const {error:le}=await s.from("accounting_supplier_bill_lines").insert(rows); if(le) throw createError({statusCode:500,statusMessage:le.message});
  await s.from("accounting_purchase_orders").update({status:"billed",updated_at:new Date().toISOString()}).eq("id",po.id);
  return await postSupplierBill(Number(bill.id),String(user.id||user.sub||""));
});
