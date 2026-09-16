import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { quoteTotals } from "~~/server/utils/manualQuote";
export default defineEventHandler(async(event)=>{
 const token=String(getRouterParam(event,"token")||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(token))throw createError({statusCode:404,statusMessage:"Quote not found."});
 const {data,error}=await getAdminSupabase().from("manual_quotes")
  .select("id,quote_number,status,issue_date,expires_at,delivery_method,delivery_amount,discount_amount,customer_notes,customer_responded_at,sales_customers(full_name,company_name),manual_quote_items(product_name,description,sku,quantity,unit_price,discount_percent,sort_order)")
  .eq("public_token",token).maybeSingle();
 if(error||!data)throw createError({statusCode:404,statusMessage:"Quote not found."});
 const items=(data.manual_quote_items||[]).sort((a:any,b:any)=>Number(a.sort_order)-Number(b.sort_order));
 return {...data,manual_quote_items:items,totals:quoteTotals({...data,manual_quote_items:items})};
});