import { getAdminSupabase } from "~~/server/utils/adminAuth";
import { createPostedJournal } from "~~/server/utils/accounting";
const r=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
async function acc(key:string){const{data,error}=await getAdminSupabase().from("accounting_accounts").select("id").eq("system_key",key).single();if(error||!data)throw new Error(`Accounting system account '${key}' is missing.`);return Number(data.id)}
export async function recordCustomerPayment(input:{invoiceId:number,amount:number,paymentDate?:string,paymentMethod?:string,reference?:string,notes?:string,userId?:string}){
 const s=getAdminSupabase();
 const{data:i,error}=await s.from("accounting_invoices").select("*").eq("id",input.invoiceId).single();if(error||!i)throw error||new Error("Invoice not found.");
 const total=r(Number(i.total||0)),paid=r(Number(i.paid_amount||0)),remaining=r(total-paid),amount=r(Number(input.amount||0));
 if(amount<=0)throw new Error("Payment amount must be greater than zero.");if(amount>remaining)throw new Error(`Payment cannot exceed the outstanding balance of $${remaining.toFixed(2)}.`);
 const [bank,receivables]=await Promise.all([acc("bank"),acc("accounts_receivable")]);
 const paymentDate=String(input.paymentDate||new Date().toISOString().slice(0,10)).slice(0,10),method=String(input.paymentMethod||"Bank Transfer").trim()||"Bank Transfer",reference=String(input.reference||"").trim();
 const j=await createPostedJournal({journal_date:paymentDate,reference:reference||i.invoice_number,description:`Customer payment — ${i.invoice_number}`,source_type:"customer_payment",source_id:String(i.id),posted_by:input.userId,lines:[{account_id:bank,debit:amount,credit:0,description:`${method}${reference?` — ${reference}`:""}`},{account_id:receivables,debit:0,credit:amount,description:`Payment against ${i.invoice_number}`}]});
 const{data:p,error:pe}=await s.from("accounting_customer_payments").insert({invoice_id:i.id,payment_date:paymentDate,amount,payment_method:method,reference:reference||null,notes:String(input.notes||"").trim()||null,journal_id:j.id}).select().single();if(pe){await s.from("accounting_journals").delete().eq("id",j.id);throw pe}
 const newPaid=r(paid+amount),status=newPaid>=total?"paid":"part_paid";const{data:updated,error:ue}=await s.from("accounting_invoices").update({paid_amount:newPaid,status,payment_method:method,payment_reference:reference||i.payment_reference||null}).eq("id",i.id).select().single();if(ue)throw ue;return{payment:p,invoice:updated,balance:r(total-newPaid)};
}
