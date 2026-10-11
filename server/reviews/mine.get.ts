import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { requireRequestUser } from "~~/server/utils/requestUser";
export default defineEventHandler(async(event)=>{ const user=await requireRequestUser(event); const supabase=getAdminSupabase(); const {data,error}=await supabase.from("product_reviews").select("id,product_id,rating,title,review,status,verified_purchase,created_at,updated_at,products(name,slug)").eq("user_id",user.id).order("updated_at",{ascending:false}); if(error) throw createError({statusCode:500,statusMessage:"Unable to load your reviews."}); return data||[]; });
