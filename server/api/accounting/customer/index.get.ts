import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.id) throw createError({ statusCode: 401, statusMessage: 'Please sign in.' })
  const db = serverSupabaseServiceRole(event)
  const { data: customer, error: ce } = await db.from('sales_customers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (ce) throw createError({ statusCode: 500, statusMessage: ce.message })
  if (!customer) return { customer: null, quotes: [], invoices: [], payments: [], balance: 0 }
  const { data: quotes, error: qe } = await db.from('manual_quotes').select('*,manual_quote_items(*)').eq('customer_id', customer.id).order('created_at', { ascending: false })
  if (qe) throw createError({ statusCode: 500, statusMessage: qe.message })
  const { data: invoices, error: ie } = await db.from('accounting_invoices').select('*,accounting_invoice_lines(*)').eq('customer_user_id', user.id).order('invoice_date', { ascending: false })
  if (ie) throw createError({ statusCode: 500, statusMessage: ie.message })
  const balance = (invoices || []).reduce((sum: number, i: any) => sum + Number(i.total || 0) - Number(i.paid_amount || 0), 0)
  return { customer, quotes: quotes || [], invoices: invoices || [], payments: [], balance }
})
