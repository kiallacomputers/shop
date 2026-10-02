import { requireAdmin } from "~~/server/utils/adminAuth";
import { paySupplierBill } from "~~/server/utils/accountingPurchases";

export default defineEventHandler(async (event) => {
  const user:any = await requireAdmin(event);
  const body:any = await readBody(event);
  try {
    return await paySupplierBill({
      billId: Number(body.bill_id),
      amount: Number(body.amount),
      reference: String(body.reference || ""),
      paymentDate: String(body.payment_date || new Date().toISOString().slice(0,10)),
      paymentMethod: String(body.payment_method || "bank_transfer"),
      bankAccountId: body.bank_account_id ? Number(body.bank_account_id) : null,
      notes: String(body.notes || ""),
      userId: String(user.id || user.sub || ""),
    });
  } catch (error:any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to record supplier payment." });
  }
});
