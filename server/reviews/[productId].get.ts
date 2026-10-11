import { getAdminSupabase } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  const productId = Number(getRouterParam(event, "productId"));
  if (!Number.isInteger(productId) || productId <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid product." });
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("product_reviews")
    .select("id,rating,title,review,verified_purchase,created_at")
    .eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false });
  if (error) throw createError({ statusCode: 500, statusMessage: "Unable to load reviews." });
  const reviews = data || [];
  const count = reviews.length;
  const average = count ? reviews.reduce((s:any,r:any)=>s+Number(r.rating||0),0)/count : 0;
  const distribution = [5,4,3,2,1].map(rating => ({ rating, count: reviews.filter((r:any)=>Number(r.rating)===rating).length }));
  return { average: Number(average.toFixed(1)), count, distribution, reviews };
});
