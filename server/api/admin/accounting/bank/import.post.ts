import { createHash } from "node:crypto";
import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);

  const body = await readBody(event);
  const bankId = Number(body.bank_account_id);
  const rows = Array.isArray(body.rows) ? body.rows : [];

  if (!bankId || !rows.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bank account and transactions are required.",
    });
  }

  const supabase = getAdminSupabase();

  const inserts = rows
    .map((row: any) => {
      const date = String(row.transaction_date || "").slice(0, 10);
      const description = String(row.description || "").trim();
      const reference = String(row.reference || "").trim();
      const amount = Math.round(Number(row.amount || 0) * 100) / 100;

      // Fingerprint the imported bank row. The bank account is deliberately
      // kept outside the hash because it is the first part of the database
      // unique key.
      const importKey = createHash("sha256")
        .update([date, description, reference, amount].join("|"))
        .digest("hex");

      return {
        bank_account_id: bankId,
        transaction_date: date,
        description,
        reference: reference || null,
        amount,
        import_key: importKey,
      };
    })
    .filter(
      (row: any) =>
        /^\d{4}-\d{2}-\d{2}$/.test(row.transaction_date) &&
        Number.isFinite(row.amount) &&
        row.amount !== 0,
    );

  if (!inserts.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid transactions found.",
    });
  }

  const { data, error } = await supabase
    .from("accounting_bank_transactions")
    .upsert(inserts, {
      onConflict: "bank_account_id,import_key",
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    if (
      error.message?.includes(
        "no unique or exclusion constraint matching the ON CONFLICT specification",
      )
    ) {
      throw createError({
        statusCode: 500,
        statusMessage:
          "Bank import database setup is incomplete. Run the bank transaction unique-index migration.",
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  return {
    imported: (data || []).length,
    skipped: inserts.length - (data || []).length,
  };
});
