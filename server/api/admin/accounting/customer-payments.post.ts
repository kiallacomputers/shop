import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { recordCustomerPayment } from "~~/server/utils/accountingCustomerPayments";
export default defineEventHandler(async(event)=>{const u:any=await requireSuperAdmin(event),b=await readBody(event);try{return await recordCustomerPayment({invoiceId:Number(b.invoice_id),amount:Number(b.amount),paymentDate:b.payment_date,paymentMethod:b.payment_method,reference:b.reference,notes:b.notes,userId:String(u.id||u.sub||"")})}catch(e:any){throw createError({statusCode:400,statusMessage:e.message})}});
