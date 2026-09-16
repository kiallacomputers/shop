import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";

const round=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
async function systemAccount(key:string){const{data,error}=await getAdminSupabase().from("accounting_accounts").select("id,code,name").eq("system_key",key).single();if(error||!data)throw new Error(`Accounting system account '${key}' is missing.`);return data}

export async function postPaidOrderToAccounting(orderId:number) {
 const s=getAdminSupabase();
 const {data:existing,error:ee}=await s.from("accounting_invoices").select("id,invoice_number,journal_id").eq("order_id",orderId).maybeSingle();
 if(ee)throw ee;if(existing)return existing;
 const {data:o,error:oe}=await s.from("orders").select("id,user_id,customer_name,customer_email,total,shipping_cost,processing_fee,stripe_session_id,created_at,order_items(id,product_id,product_name,product_code,quantity,price)").eq("id",orderId).single();
 if(oe||!o)throw oe||new Error("Order not found");
 const total=round(Number(o.total||0)),gst=round(total/11),subtotal=round(total-gst);
 const [bank,sales,gstCollected]=await Promise.all([systemAccount("bank"),systemAccount("sales_revenue"),systemAccount("gst_collected")]);
 const journal=await createPostedJournal({journal_date:String(o.created_at||new Date().toISOString()).slice(0,10),reference:`Order #${o.id}`,description:`Paid online order #${o.id}`,source_type:"order",source_id:String(o.id),posted_by:undefined,lines:[
  {account_id:bank.id,debit:total,credit:0,description:`Stripe payment — order #${o.id}`},
  {account_id:sales.id,debit:0,credit:subtotal,description:"Sales revenue ex GST"},
  {account_id:gstCollected.id,debit:0,credit:gst,description:"GST collected"}
 ]});
 const {data:inv,error:ie}=await s.from("accounting_invoices").insert({order_id:o.id,customer_user_id:o.user_id||null,customer_name:o.customer_name,customer_email:o.customer_email,invoice_date:String(o.created_at||new Date().toISOString()).slice(0,10),status:"paid",subtotal,gst_amount:gst,total,paid_amount:total,payment_method:"Stripe",payment_reference:o.stripe_session_id,journal_id:journal.id}).select().single();
 if(ie||!inv){await s.from("accounting_journals").delete().eq("id",journal.id);throw ie||new Error("Invoice creation failed")}
 const items=Array.isArray(o.order_items)?o.order_items:[];
 const rows=items.map((x:any,n:number)=>{const lineTotal=round(Number(x.quantity||0)*Number(x.price||0));return{invoice_id:inv.id,product_id:x.product_id||null,description:x.product_name||"Product",sku:x.product_code||null,quantity:Number(x.quantity||0),unit_price:Number(x.price||0),line_total:lineTotal,gst_amount:round(lineTotal/11),sort_order:n}});
 const itemSum=round(rows.reduce((a:number,x:any)=>a+x.line_total,0));
 if(Number(o.shipping_cost||0)>0)rows.push({invoice_id:inv.id,product_id:null,description:"Delivery",sku:null,quantity:1,unit_price:Number(o.shipping_cost),line_total:Number(o.shipping_cost),gst_amount:round(Number(o.shipping_cost)/11),sort_order:rows.length});
 if(Number(o.processing_fee||0)>0)rows.push({invoice_id:inv.id,product_id:null,description:"Processing Fee",sku:null,quantity:1,unit_price:Number(o.processing_fee),line_total:Number(o.processing_fee),gst_amount:round(Number(o.processing_fee)/11),sort_order:rows.length});
 // Stripe line metadata can differ from the final order total (discounts/adjustments).
 // Preserve a balancing invoice line so the accounting invoice always equals the payment.
 const visible=round(rows.reduce((a:number,x:any)=>a+Number(x.line_total),0)),difference=round(total-visible);
 if(Math.abs(difference)>=0.01)rows.push({invoice_id:inv.id,product_id:null,description:difference>0?"Order Adjustment":"Order Discount",sku:null,quantity:1,unit_price:difference,line_total:difference,gst_amount:round(difference/11),sort_order:rows.length});
 if(rows.length){const{error:le}=await s.from("accounting_invoice_lines").insert(rows);if(le)console.error("ACCOUNTING INVOICE LINE ERROR",le)}
 return inv;
}
