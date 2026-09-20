import { requireSuperAdmin } from "~~/server/utils/adminAuth";
import { paySupplierBills } from "~~/server/utils/accountingPurchases";

export default defineEventHandler(async (event) => {
  const user:any = await requireSuperAdmin(event);
  const body:any = await readBody(event);
  try {
    return await paySupplierBills({
      supplierId: Number(body.supplier_id),
      reference: String(body.reference || ""),
      paymentDate: String(body.payment_date || new Date().toISOString().slice(0,10)),
      allocations: Array.isArray(body.allocations) ? body.allocations : [],
      userId: String(user.id || user.sub || "")
    });
  } catch (error:any) {
    throw createError({ statusCode: 400, statusMessage: error?.message || "Unable to record supplier payment." });
  }
});
