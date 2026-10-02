import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";

const n=(v:any)=>Number(v||0);
const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;

async function account(s:any,key:string){
  const{data,error}=await s.from("accounting_accounts").select("id,name").eq("system_key",key).single();
  if(error||!data)throw createError({statusCode:500,statusMessage:`Accounting account '${key}' is missing. Run the inventory adjustment GL migration.`});
  return {id:Number(data.id),name:String(data.name||key)};
}

async function removeJournal(s:any,journalId:number|null|undefined){
  if(!journalId)return;
  await s.from("accounting_journal_lines").delete().eq("journal_id",journalId);
  await s.from("accounting_journals").delete().eq("id",journalId);
}

const OUT_TYPES:any={
  damaged:{key:"inventory_writeoff",label:"Damaged Stock"},
  lost_missing:{key:"inventory_shrinkage",label:"Lost / Missing"},
  internal_use:{key:"inventory_internal_use",label:"Internal Business Use"},
  stocktake_variance:{key:"inventory_variance",label:"Stocktake Variance"},
  correction:{key:"inventory_adjustment_expense",label:"Correction"},
  other:{key:"inventory_adjustment_expense",label:"Other"},
};
const IN_TYPES:any={
  found_stock:{key:"inventory_adjustment_gain",label:"Found Stock"},
  stocktake_variance:{key:"inventory_adjustment_gain",label:"Stocktake Variance"},
  opening_stock:{key:"inventory_opening_balance",label:"Opening Stock"},
  correction:{key:"inventory_adjustment_gain",label:"Correction"},
  other:{key:"inventory_adjustment_gain",label:"Other"},
};

export default defineEventHandler(async(event)=>{
  const user:any=await requireAdmin(event),b=await readBody(event),s=getAdminSupabase();
  const productId=Number(b?.product_id),variantId=Number(b?.variant_id||0)||null;
  const rawQty=Number(b?.quantity),qty=Number.isInteger(rawQty)&&rawQty>0?rawQty:0,direction=String(b?.direction||"");
  const adjustmentType=String(b?.adjustment_type||"").trim();
  const reason=String(b?.reason||"").trim(),notes=String(b?.notes||"").trim();
  if(!productId)throw createError({statusCode:400,statusMessage:"A product is required."});
  if(!["in","out"].includes(direction))throw createError({statusCode:400,statusMessage:"Select whether stock is being increased or reduced."});
  if(qty<=0)throw createError({statusCode:400,statusMessage:"Enter a whole adjustment quantity greater than zero."});
  if(reason.length<3)throw createError({statusCode:400,statusMessage:"An adjustment reason is required."});
  const typeConfig=(direction==="out"?OUT_TYPES:IN_TYPES)[adjustmentType];
  if(!typeConfig)throw createError({statusCode:400,statusMessage:"Select a valid adjustment type."});

  const{data:p,error}=await s.from("products").select("id,name,stock,buy_price_ex_gst,landed_cost_ex_gst").eq("id",productId).single();
  if(error||!p)throw createError({statusCode:404,statusMessage:"Product not found."});
  let variant:any=null;
  if(variantId){
    const{data:v,error:ve}=await s.from("product_variants").select("id,name,stock").eq("id",variantId).eq("product_id",productId).single();
    if(ve||!v)throw createError({statusCode:404,statusMessage:"Product variant not found."});
    variant=v;
  }
  const oldStock=n(variant?variant.stock:p.stock);
  if(direction==="out"&&qty>oldStock)throw createError({statusCode:400,statusMessage:"Adjustment cannot reduce stock below zero."});

  const unitCost=r(b?.unit_cost==null?n(p.landed_cost_ex_gst??p.buy_price_ex_gst):n(b.unit_cost));
  const total=r(qty*unitCost),newStock=direction==="in"?oldStock+qty:oldStock-qty;
  const inventory=await account(s,"inventory"),offset=total>0?await account(s,typeConfig.key):null;
  const reference=String(b?.reference||`ADJ-${new Date().toISOString().slice(0,10)}`).trim();
  const movementDate=b?.movement_date||new Date().toISOString().slice(0,10);

  // Lock the quantity first using an optimistic stock comparison.  Unlike the old code,
  // .select().maybeSingle() lets us detect a zero-row update (concurrent stock change).
  const stockTable=variant?"product_variants":"products";
  let uq=s.from(stockTable).update({stock:newStock}).eq("id",variant?variantId:productId).eq("stock",oldStock);
  if(variant)uq=uq.eq("product_id",productId);
  const{data:updated,error:ue}=await uq.select("id,stock").maybeSingle();
  if(ue||!updated)throw createError({statusCode:409,statusMessage:"Stock changed before the adjustment could be posted. Refresh and try again."});

  let journal:any=null;
  try{
    if(total>0&&offset){
      journal=await createPostedJournal({
        journal_date:movementDate,reference,
        description:`Inventory adjustment — ${p.name}: ${typeConfig.label} — ${reason}`,
        source_type:"inventory_adjustment",source_id:String(productId),posted_by:user?.id||user?.sub||"",
        lines:direction==="in"
          ?[{account_id:inventory.id,debit:total,credit:0,description:p.name},{account_id:offset.id,debit:0,credit:total,description:typeConfig.label}]
          :[{account_id:offset.id,debit:total,credit:0,description:typeConfig.label},{account_id:inventory.id,debit:0,credit:total,description:p.name}]
      });
    }

    const{error:me}=await s.from("accounting_inventory_movements").insert({
      product_id:productId,order_id:null,movement_type:direction==="in"?"adjustment_in":"adjustment_out",
      quantity:direction==="in"?qty:-qty,unit_cost:unitCost,total_cost:direction==="in"?total:-total,
      reference,notes:[`Type: ${typeConfig.label}`,variant?`Variant: ${variant.name}`:"",reason,notes].filter(Boolean).join(" — "),
      journal_id:journal?.id||null,movement_date:movementDate
    });
    if(me)throw new Error(me.message);
  }catch(err:any){
    // Compensating rollback: remove any journal we created and restore stock, but only
    // if the stock is still at the quantity written by this request.
    await removeJournal(s,journal?.id);
    let rollback=s.from(stockTable).update({stock:oldStock}).eq("id",variant?variantId:productId).eq("stock",newStock);
    if(variant)rollback=rollback.eq("product_id",productId);
    const{data:rolledBack}=await rollback.select("id").maybeSingle();
    if(!rolledBack)throw createError({statusCode:500,statusMessage:"The accounting post failed and stock changed again before it could be restored. Review this product and the General Ledger immediately."});
    throw createError({statusCode:500,statusMessage:`Adjustment was not posted and stock was restored. ${err?.statusMessage||err?.message||"Accounting posting failed."}`});
  }

  return{ok:true,old_stock:oldStock,stock:newStock,quantity_change:direction==="in"?qty:-qty,adjustment_type:adjustmentType,journal_id:journal?.id||null};
});
