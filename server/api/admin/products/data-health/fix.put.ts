import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
const text=(v:any)=>String(v??"").trim();
const num=(v:any)=>Number(v);
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const s=getAdminSupabase(), body=await readBody(event);
  const productId=Number(body?.product_id), issue=text(body?.issue);
  if(!productId) throw createError({statusCode:400,statusMessage:"Product is required"});
  const {data:product,error:pe}=await s.from("products").select("id,product_code,low_stock_level,reorder_level,target_stock_level,buy_price_ex_gst").eq("id",productId).maybeSingle();
  if(pe||!product) throw createError({statusCode:404,statusMessage:"Product not found"});
  if(issue==="sku"){
    const value=text(body.value); if(!value) throw createError({statusCode:400,statusMessage:"Product code is required"});
    const [{data:p},{data:v}]=await Promise.all([
      s.from("products").select("id").ilike("product_code",value).neq("id",productId).limit(1).maybeSingle(),
      s.from("product_variants").select("id").ilike("product_code",value).limit(1).maybeSingle()
    ]);
    if(p||v) throw createError({statusCode:409,statusMessage:"That product code is already in use"});
    const {error}=await s.from("products").update({product_code:value}).eq("id",productId); if(error) throw createError({statusCode:400,statusMessage:error.message});
  } else if(issue==="category"){
    const id=Number(body.value); if(!id) throw createError({statusCode:400,statusMessage:"Choose a category"});
    const {error}=await s.from("products").update({category_id:id}).eq("id",productId); if(error) throw createError({statusCode:400,statusMessage:error.message});
  } else if(["target","levels"].includes(issue)){
    const low=num(body.low_stock_level), reorder=num(body.reorder_level), target=num(body.target_stock_level);
    if(!Number.isInteger(low)||low<0||!Number.isInteger(reorder)||reorder<0||!Number.isInteger(target)||target<0) throw createError({statusCode:400,statusMessage:"Stock levels must be whole numbers of 0 or more"});
    if(reorder<low) throw createError({statusCode:400,statusMessage:"Reorder level must be equal to or higher than Low Stock"});
    if(target<reorder) throw createError({statusCode:400,statusMessage:"Target Stock must be equal to or higher than Reorder"});
    const {error}=await s.from("products").update({low_stock_level:low,reorder_level:reorder,target_stock_level:target}).eq("id",productId); if(error) throw createError({statusCode:400,statusMessage:error.message});
  } else if(issue==="sell_price"){
    const value=num(body.value); if(!Number.isFinite(value)||value<=0) throw createError({statusCode:400,statusMessage:"Sell price must be greater than 0"});
    const {error}=await s.from("products").update({price:Math.round(value*100)/100}).eq("id",productId); if(error) throw createError({statusCode:400,statusMessage:error.message});
  } else if(issue==="buy_price"){
    const value=num(body.value); if(!Number.isFinite(value)||value<=0) throw createError({statusCode:400,statusMessage:"Buy price must be greater than 0"});
    const supplierId=Number(body.supplier_id||0);
    if(supplierId){
      const {error}=await s.from("accounting_product_suppliers").update({buy_price_ex_gst:Math.round(value*100)/100,updated_at:new Date().toISOString()}).eq("product_id",productId).eq("supplier_id",supplierId);
      if(error) throw createError({statusCode:400,statusMessage:error.message});
    } else {
      const {error}=await s.from("products").update({buy_price_ex_gst:Math.round(value*100)/100}).eq("id",productId); if(error) throw createError({statusCode:400,statusMessage:error.message});
    }
  } else if(["supplier","primary_supplier","supplier_sku"].includes(issue)){
    const supplierId=Number(body.supplier_id); if(!supplierId) throw createError({statusCode:400,statusMessage:"Choose a supplier"});
    const {data:existing,error:ee}=await s.from("accounting_product_suppliers").select("*").eq("product_id",productId);
    if(ee) throw createError({statusCode:400,statusMessage:ee.message});
    const rows:any[]=[...(existing||[])]; let row=rows.find(x=>Number(x.supplier_id)===supplierId);
    if(!row){row={product_id:productId,supplier_id:supplierId,supplier_sku:null,buy_price_ex_gst:null,is_primary:false};rows.push(row)}
    if(body.supplier_sku!==undefined) row.supplier_sku=text(body.supplier_sku)||null;
    if(body.buy_price_ex_gst!==undefined&&body.buy_price_ex_gst!==""){const b=num(body.buy_price_ex_gst);if(!Number.isFinite(b)||b<0)throw createError({statusCode:400,statusMessage:"Buy price is invalid"});row.buy_price_ex_gst=Math.round(b*100)/100}
    if(issue==="supplier"||issue==="primary_supplier"||body.is_primary===true){for(const x of rows)x.is_primary=Number(x.supplier_id)===supplierId}
    const {error:del}=await s.from("accounting_product_suppliers").delete().eq("product_id",productId); if(del)throw createError({statusCode:400,statusMessage:del.message});
    const payload=rows.map(x=>({product_id:productId,supplier_id:Number(x.supplier_id),supplier_sku:text(x.supplier_sku)||null,buy_price_ex_gst:x.buy_price_ex_gst==null?null:Number(x.buy_price_ex_gst),is_primary:x.is_primary===true,updated_at:new Date().toISOString()}));
    const {error:ins}=await s.from("accounting_product_suppliers").insert(payload); if(ins)throw createError({statusCode:400,statusMessage:ins.message});
  } else throw createError({statusCode:400,statusMessage:"Unsupported health issue"});
  return {ok:true};
});