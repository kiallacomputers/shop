import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";
const n=(v:any)=>Number(v||0); const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
async function account(s:any,key:string){const{data,error}=await s.from("accounting_accounts").select("id").eq("system_key",key).single();if(error||!data)throw createError({statusCode:500,statusMessage:`Accounting account '${key}' is missing.`});return Number(data.id)}
export default defineEventHandler(async(event)=>{
 const user:any=await requireAdmin(event),b=await readBody(event),s=getAdminSupabase();
 const productId=Number(b?.product_id),variantId=Number(b?.variant_id||0)||null;
 const rawQty=Number(b?.quantity),qty=Number.isInteger(rawQty)&&rawQty>0?rawQty:0,direction=String(b?.direction||"");
 const reason=String(b?.reason||"").trim(),notes=String(b?.notes||"").trim();
 if(!productId)throw createError({statusCode:400,statusMessage:"A product is required."});
 if(!["in","out"].includes(direction))throw createError({statusCode:400,statusMessage:"Select whether stock is being increased or reduced."});
 if(qty<=0)throw createError({statusCode:400,statusMessage:"Enter a whole adjustment quantity greater than zero."});
 if(reason.length<3)throw createError({statusCode:400,statusMessage:"An adjustment reason is required."});
 const{data:p,error}=await s.from("products").select("id,name,stock,buy_price_ex_gst,landed_cost_ex_gst").eq("id",productId).single();
 if(error||!p)throw createError({statusCode:404,statusMessage:"Product not found."});
 let variant:any=null;if(variantId){const{data:v,error:ve}=await s.from("product_variants").select("id,name,stock").eq("id",variantId).eq("product_id",productId).single();if(ve||!v)throw createError({statusCode:404,statusMessage:"Product variant not found."});variant=v} const oldStock=n(variant?variant.stock:p.stock);if(direction==="out"&&qty>oldStock)throw createError({statusCode:400,statusMessage:"Adjustment cannot reduce stock below zero."});
 const unitCost=r(b?.unit_cost==null?n(p.landed_cost_ex_gst??p.buy_price_ex_gst):n(b.unit_cost)),total=r(qty*unitCost),newStock=direction==="in"?oldStock+qty:oldStock-qty;
 const inventory=await account(s,"inventory"),expense=await account(s,"general_expense");
 const reference=String(b?.reference||`ADJ-${new Date().toISOString().slice(0,10)}`).trim();
 const journal=total>0?await createPostedJournal({journal_date:b?.movement_date||new Date().toISOString().slice(0,10),reference,description:`Inventory adjustment — ${p.name}: ${reason}`,source_type:"inventory_adjustment",source_id:String(productId),posted_by:user?.id||user?.sub||"",lines:direction==="in"?[{account_id:inventory,debit:total,credit:0,description:p.name},{account_id:expense,debit:0,credit:total,description:"Inventory adjustment gain"}]:[{account_id:expense,debit:total,credit:0,description:"Inventory adjustment loss"},{account_id:inventory,debit:0,credit:total,description:p.name}]}):null;
 const stockTable=variant?"product_variants":"products";let uq=s.from(stockTable).update({stock:newStock}).eq("id",variant?variantId:productId).eq("stock",oldStock);if(variant)uq=uq.eq("product_id",productId);const{error:ue}=await uq;if(ue)throw createError({statusCode:409,statusMessage:"Stock changed before the adjustment could be posted. Refresh and try again."});
 const{error:me}=await s.from("accounting_inventory_movements").insert({product_id:productId,order_id:null,movement_type:direction==="in"?"adjustment_in":"adjustment_out",quantity:direction==="in"?qty:-qty,unit_cost:unitCost,total_cost:direction==="in"?total:-total,reference,notes:[variant?`Variant: ${variant.name}`:"",reason,notes].filter(Boolean).join(" — "),journal_id:journal?.id||null,movement_date:b?.movement_date||new Date().toISOString().slice(0,10)});if(me)throw createError({statusCode:500,statusMessage:me.message});
 return{ok:true,old_stock:oldStock,stock:newStock,quantity_change:direction==="in"?qty:-qty,journal_id:journal?.id||null};
});
