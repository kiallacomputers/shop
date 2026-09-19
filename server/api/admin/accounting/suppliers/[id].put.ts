import { getAdminSupabase, requireSuperAdmin } from "~~/server/utils/adminAuth"

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "A valid supplier ID is required." })
  }

  const body = await readBody(event)
  const name = String(body?.name || "").trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Supplier name is required." })
  }

  const clean = (value: unknown) => {
    const text = String(value ?? "").trim()
    return text || null
  }

  const { data, error } = await getAdminSupabase()
    .from("accounting_suppliers")
    .update({
      name,
      contact_name: clean(body?.contact_name),
      email: clean(body?.email),
      phone: clean(body?.phone),
      abn: clean(body?.abn),
      address: clean(body?.address),
      notes: clean(body?.notes)
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return data
})
