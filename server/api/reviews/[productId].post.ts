import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
export default defineEventHandler(async (event) => {
  const user = await requireRequestUser(event); const productId = Number(getRouterParam(event,"productId")); const body = await readBody(event);
  const rating=Number(body?.rating), title=String(body?.title||"").trim(), review=String(body?.review||"").trim();
  if(!Number.isInteger(productId)||productId<=0) throw createError({statusCode:400,statusMessage:"Invalid product."});
  if(!Number.isInteger(rating)||rating<1||rating>5) throw createError({statusCode:400,statusMessage:"Choose a rating from 1 to 5 stars."});
  if(title.length>120) throw createError({statusCode:400,statusMessage:"Review title must be 120 characters or less."});
  if(review.length<10||review.length>3000) throw createError({statusCode:400,statusMessage:"Review must be between 10 and 3000 characters."});
  const supabase=getAdminSupabase(); const {data:items,error:itemError}=await supabase.from("order_items").select("order_id,orders!inner(id,user_id,status)").eq("product_id",productId);
  if(itemError) throw createError({statusCode:500,statusMessage:"Unable to verify your purchase."});
  const delivered=(items||[]).find((row:any)=>row.orders?.user_id===user.id&&String(row.orders?.status).toLowerCase()==="delivered");
  if(!delivered) throw createError({statusCode:403,statusMessage:"Reviews are available after a verified purchase has been delivered."});
  const payload={product_id:productId,user_id:user.id,order_id:delivered.order_id,rating,title,review,verified_purchase:true,status:"pending",updated_at:new Date().toISOString()};
  const {data,error}=await supabase.from("product_reviews").upsert(payload,{onConflict:"product_id,user_id"}).select("id,status").single();
  if(error) throw createError({statusCode:500,statusMessage:error.message||"Unable to save review."});
  return {...data,message:"Thanks. Your review has been submitted for approval."};
});
