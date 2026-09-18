import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

const n=(v:any)=>Number(v||0); const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export default defineEventHandler(async(event)=>{
  const user:any=await requireSuperAdmin(event); const id=Number(getRouterParam(event,"id")); const body=await readBody(event); const s=getAdminSupabase();
  if(!id) throw createError({statusCode:400,statusMessage:"Invalid purchase order."});
  const {data:po,error}=await s.from("accounting_purchase_orders").select("*,accounting_purchase_order_lines(*)").eq("id",id).single();
  if(error||!po) throw createError({statusCode:404,statusMessage:"Purchase order not found."});
  const poLines:any[]=po.accounting_purchase_order_lines||[];
  const requested=new Map<number,number>((Array.isArray(body?.lines)?body.lines:[]).map((x:any)=>[Number(x.purchase_order_line_id),n(x.quantity)]));
  const lineIds=poLines.map(x=>Number(x.id));
  let prior:any[]=[];
  if(lineIds.length){const {data,error:re}=await s.from("accounting_inventory_receipt_lines").select("purchase_order_line_id,quantity").in("purchase_order_line_id",lineIds);if(re)throw createError({statusCode:500,statusMessage:re.message});prior=data||[]}
  const received=new Map<number,number>(); for(const x of prior)received.set(Number(x.purchase_order_line_id),n(received.get(Number(x.purchase_order_line_id)))+n(x.quantity));
  const valid:any[]=[];
  for(const l of poLines){const qty=n(requested.get(Number(l.id)));if(qty<=0)continue;if(!l.product_id)throw createError({statusCode:400,statusMessage:`${l.description} is a custom/non-stock line and cannot be received into inventory.`});const remaining=Math.max(0,n(l.quantity)-n(received.get(Number(l.id))));if(qty>remaining+0.0001)throw createError({statusCode:400,statusMessage:`Receive quantity for ${l.description} exceeds the ${remaining} remaining.`});valid.push({line:l,qty})}
  if(!valid.length)throw createError({statusCode:400,statusMessage:"Enter a quantity to receive for at least one stock item."});
  const {data:receipt,error:he}=await s.from("accounting_inventory_receipts").insert({purchase_order_id:id,received_date:body?.received_date||new Date().toISOString().slice(0,10),supplier_reference:body?.supplier_reference||po.supplier_reference||null,notes:body?.notes||null,created_by:user?.id||user?.sub||null}).select().single();
  if(he||!receipt)throw createError({statusCode:500,statusMessage:he?.message||"Unable to create stock receipt."});
  for(const x of valid){const l=x.line,qty=x.qty,productId=Number(l.product_id),cost=r(n(l.unit_cost_ex_gst));const {data:p,error:pe}=await s.from("products").select("id,stock,buy_price_ex_gst,name").eq("id",productId).single();if(pe||!p)throw createError({statusCode:500,statusMessage:pe?.message||`Product ${productId} not found.`});const oldQty=n(p.stock),oldCost=n(p.buy_price_ex_gst),newQty=oldQty+qty,newCost=newQty>0?r(((oldQty*oldCost)+(qty*cost))/newQty):cost;const {error:ue}=await s.from("products").update({stock:newQty,buy_price_ex_gst:newCost}).eq("id",productId);if(ue)throw createError({statusCode:500,statusMessage:ue.message});const {error:le}=await s.from("accounting_inventory_receipt_lines").insert({receipt_id:receipt.id,purchase_order_line_id:l.id,product_id:productId,quantity:qty,unit_cost:cost});if(le)throw createError({statusCode:500,statusMessage:le.message});const {error:me}=await s.from("accounting_inventory_movements").insert({product_id:productId,order_id:null,movement_type:"purchase",quantity:qty,unit_cost:cost,total_cost:r(qty*cost),reference:`${po.po_number||`PO-${id}`} / Receipt ${receipt.id}`,notes:body?.notes||null,movement_date:receipt.received_date});if(me)throw createError({statusCode:500,statusMessage:me.message})}
  // Determine whether every stock line is fully received. Non-stock lines do not affect receiving status.
  const {data:allReceipts}=await s.from("accounting_inventory_receipt_lines").select("purchase_order_line_id,quantity").in("purchase_order_line_id",lineIds);
  const totals=new Map<number,number>();for(const x of allReceipts||[])totals.set(Number(x.purchase_order_line_id),n(totals.get(Number(x.purchase_order_line_id)))+n(x.quantity));
  const stockLines=poLines.filter(x=>x.product_id);const complete=stockLines.length>0&&stockLines.every(x=>n(totals.get(Number(x.id)))>=n(x.quantity)-0.0001);
  const nextStatus=complete?(po.status==="billed"?"billed":"received"):(po.status==="billed"?"billed":"part_received");
  await s.from("accounting_purchase_orders").update({status:nextStatus,updated_at:new Date().toISOString()}).eq("id",id);
  return {ok:true,receipt_id:receipt.id,status:nextStatus};
});
