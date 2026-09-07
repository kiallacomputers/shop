import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
export default defineEventHandler(async (event) => {
  await requireAdmin(event); const productId=Number(getRouterParam(event,"id"));
  if(!Number.isInteger(productId)) throw createError({statusCode:400,statusMessage:"Invalid product ID"});
  const supabase=getAdminSupabase();
  const {data,error}=await supabase.from("product_variants").select("*").eq("product_id",productId).order("sort_order").order("id");
  if(error) throw createError({statusCode:500,statusMessage:error.message}); return data||[];
});
