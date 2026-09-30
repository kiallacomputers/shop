import { requireRequestUser } from "~~/server/utils/requestUser";
import { getAdminSupabase } from "~~/server/utils/adminAuth";
const money=(v:any)=>Math.round(Number(v||0)*100)/100;
export default defineEventHandler(async(event)=>{
 const user:any=await requireRequestUser(event); const body:any=await readBody(event); const items=Array.isArray(body?.items)?body.items:[]; const db=getAdminSupabase();
 const safe=items.map((x:any)=>({id:Number(x.id),cartKey:String(x.cartKey||x.id),variantId:x.variantId==null?null:Number(x.variantId),variantName:x.variantName||null,productCode:x.productCode||null,name:String(x.name||''),slug:String(x.slug||''),price:money(x.price),image:x.image||null,selectedAddons:Array.isArray(x.selectedAddons)?x.selectedAddons:[],quantity:Math.max(1,Number(x.quantity||1))})).filter((x:any)=>Number.isInteger(x.id)&&x.id>0&&x.name);
 const now=new Date().toISOString();
 const {data:open}=await db.from('abandoned_carts').select('id,status').eq('user_id',user.id).in('status',['active','abandoned','recovered']).maybeSingle();
 if(!safe.length){ if(open?.id) await db.from('abandoned_carts').update({status:'expired',updated_at:now}).eq('id',open.id); return {ok:true,empty:true}; }
 const value=money(safe.reduce((s:number,x:any)=>s+x.price*x.quantity,0)); const count=safe.reduce((s:number,x:any)=>s+x.quantity,0);
 const payload={customer_email:user.email||null,customer_name:user.user_metadata?.full_name||user.user_metadata?.name||null,items:safe,cart_value:value,item_count:count,status:'active',last_activity_at:now,abandoned_at:null,updated_at:now};
 if(open?.id){const {error}=await db.from('abandoned_carts').update(payload).eq('id',open.id);if(error)throw createError({statusCode:500,statusMessage:error.message});return {ok:true,id:open.id};}
 const {data,error}=await db.from('abandoned_carts').insert({user_id:user.id,...payload}).select('id').single(); if(error)throw createError({statusCode:500,statusMessage:error.message}); return {ok:true,id:data.id};
});
