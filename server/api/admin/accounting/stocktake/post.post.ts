import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";

const n=(v:any)=>Number(v||0);
const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;

async function account(s:any,key:string){
  const {data,error}=await s.from("accounting_accounts").select("id").eq("system_key",key).single();
  if(error||!data) throw createError({statusCode:500,statusMessage:`Accounting account '${key}' is missing.`});
  return Number(data.id);
}

export default defineEventHandler(async(event)=>{
  const user:any=await requireSuperAdmin(event);
  const body=await readBody(event);
  const items=Array.isArray(body?.items)?body.items:[];
  if(!items.length) throw createError({statusCode:400,statusMessage:"No stocktake variances were supplied."});
  if(items.length>1000) throw createError({statusCode:400,statusMessage:"Too many stocktake lines in one posting."});

  const movementDate=String(body?.movement_date||new Date().toISOString().slice(0,10));
  const reference=String(body?.reference||`ST-${movementDate.replaceAll("-","")}`).trim();
  const reason=String(body?.reason||"Stocktake variance").trim();
  const notes=String(body?.notes||"").trim();
  const s=getAdminSupabase();
  const inventory=await account(s,"inventory");
  const expense=await account(s,"general_expense");

  const ids=[...new Set(items.map((x:any)=>Number(x?.product_id)).filter((x:number)=>Number.isInteger(x)&&x>0))];
  if(ids.length!==items.length) throw createError({statusCode:400,statusMessage:"Each stocktake line requires a unique valid product."});

  const {data:products,error:pe}=await s.from("products").select("id,name,product_code,stock,buy_price_ex_gst").in("id",ids);
  if(pe) throw createError({statusCode:500,statusMessage:pe.message});
  if((products||[]).length!==ids.length) throw createError({statusCode:404,statusMessage:"One or more stocktake products could not be found."});
  const map=new Map((products||[]).map((p:any)=>[Number(p.id),p]));

  const changes:any[]=[];
  for(const item of items){
    const id=Number(item.product_id), counted=Number(item.counted_stock), p:any=map.get(id);
    if(!Number.isInteger(counted)||counted<0) throw createError({statusCode:400,statusMessage:`${p?.name||`Product ${id}`}: counted stock must be a whole number of 0 or more.`});
    const system=n(p.stock), variance=counted-system;
    if(!variance) continue;
    const unitCost=r(n(p.buy_price_ex_gst)), total=r(Math.abs(variance)*unitCost);
    changes.push({p,system,counted,variance,unitCost,total});
  }
  if(!changes.length) return {ok:true,adjustments:0,journals:0};

  let adjustments=0,journals=0;
  for(const x of changes){
    const direction=x.variance>0?"in":"out";
    const description=`Stocktake ${direction==="in"?"gain":"loss"} — ${x.p.name}`;
    const lineRef=`${reference} / ${x.p.product_code||x.p.id}`;

    const journal=x.total>0?await createPostedJournal({
      journal_date:movementDate,
      reference:lineRef,
      description,
      source_type:"stocktake",
      source_id:String(x.p.id),
      posted_by:user?.id||user?.sub||"",
      lines:direction==="in"
        ?[
          {account_id:inventory,debit:x.total,credit:0,description:`${x.p.name} stocktake gain`},
          {account_id:expense,debit:0,credit:x.total,description:`${x.p.name} stocktake gain`}
        ]
        :[
          {account_id:expense,debit:x.total,credit:0,description:`${x.p.name} stocktake loss`},
          {account_id:inventory,debit:0,credit:x.total,description:`${x.p.name} stocktake loss`}
        ]
    }):null;

    const {error:ue}=await s.from("products").update({stock:x.counted}).eq("id",x.p.id).eq("stock",x.system);
    if(ue) throw createError({statusCode:500,statusMessage:`${x.p.name}: ${ue.message}`});

    const movementNotes=[reason,notes,`System stock: ${x.system}; Counted stock: ${x.counted}`].filter(Boolean).join(" — ");
    const {error:me}=await s.from("accounting_inventory_movements").insert({
      product_id:x.p.id,
      order_id:null,
      movement_type:direction==="in"?"stocktake_in":"stocktake_out",
      quantity:x.variance,
      unit_cost:x.unitCost,
      total_cost:direction==="in"?x.total:-x.total,
      reference:lineRef,
      notes:movementNotes,
      journal_id:journal?.id||null,
      movement_date:movementDate
    });
    if(me) throw createError({statusCode:500,statusMessage:`${x.p.name}: stock changed but movement logging failed: ${me.message}`});
    adjustments++;
    if(journal?.id) journals++;
  }

  return {ok:true,adjustments,journals,reference};
});
