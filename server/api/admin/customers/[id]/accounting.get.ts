import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminSupabase, requireAdmin } from '~~/server/utils/adminAuth'
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = getAdminSupabase()
  const { data: customer, error } = await db.from('sales_customers').select('*').eq('id', id).single()
  if (error) throw createError({ statusCode: 404, statusMessage: error.message })
  const { data: quotes } = await db.from('manual_quotes').select('*,manual_quote_items(*)').eq('customer_id', id).order('created_at', { ascending: false })
  const { data: invoices } = customer.auth_user_id ? await db.from('accounting_invoices').select('*,accounting_invoice_lines(*)').eq('customer_user_id', customer.auth_user_id).order('invoice_date', { ascending: false }) : { data: [] }
  const balance = (invoices || []).reduce((sum: number, i: any) => sum + Number(i.total || 0) - Number(i.paid_amount || 0), 0)
  return { customer, quotes: quotes || [], invoices: invoices || [], payments: [], balance }
})
