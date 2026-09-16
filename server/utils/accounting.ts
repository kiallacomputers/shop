import { getAdminSupabase } from "~~/server/utils/adminAuth";

const cents = (value:any) => Math.round(Number(value || 0) * 100);

export function validateJournalLines(lines:any[]) {
  if (!Array.isArray(lines) || lines.length < 2) throw createError({statusCode:400,statusMessage:"A journal needs at least two lines."});
  let debit=0, credit=0;
  for (const line of lines) {
    const d=cents(line?.debit), c=cents(line?.credit);
    if (!Number.isInteger(Number(line?.account_id)) || Number(line.account_id)<=0) throw createError({statusCode:400,statusMessage:"Each journal line needs an account."});
    if ((d>0 && c>0) || (d<=0 && c<=0)) throw createError({statusCode:400,statusMessage:"Each line must contain either a debit or a credit."});
    debit+=d; credit+=c;
  }
  if (debit!==credit) throw createError({statusCode:400,statusMessage:"Journal is not balanced. Total debits must equal total credits."});
  if (debit<=0) throw createError({statusCode:400,statusMessage:"Journal total must be greater than zero."});
  return {debit:debit/100,credit:credit/100};
}

export async function createPostedJournal(input:{journal_date?:string,reference?:string,description:string,source_type?:string,source_id?:string,posted_by?:string,lines:any[]}) {
  validateJournalLines(input.lines);
  const s=getAdminSupabase();
  const accountIds=[...new Set(input.lines.map((x:any)=>Number(x.account_id)))];
  const {data:accounts,error:ae}=await s.from("accounting_accounts").select("id,active,allow_manual_posting").in("id",accountIds);
  if(ae)throw createError({statusCode:500,statusMessage:ae.message});
  if((accounts||[]).length!==accountIds.length || (accounts||[]).some((a:any)=>!a.active))throw createError({statusCode:400,statusMessage:"One or more accounts are unavailable."});
  const {data:j,error:je}=await s.from("accounting_journals").insert({journal_date:input.journal_date||new Date().toISOString().slice(0,10),reference:input.reference||null,description:input.description,source_type:input.source_type||"manual",source_id:input.source_id||null,status:"posted",posted_at:new Date().toISOString(),posted_by:input.posted_by||null}).select().single();
  if(je)throw createError({statusCode:500,statusMessage:je.message});
  const rows=input.lines.map((x:any,n:number)=>({journal_id:j.id,account_id:Number(x.account_id),description:String(x.description||"").trim()||null,debit:Number(x.debit||0),credit:Number(x.credit||0),sort_order:n}));
  const {error:le}=await s.from("accounting_journal_lines").insert(rows);
  if(le){await s.from("accounting_journals").delete().eq("id",j.id);throw createError({statusCode:500,statusMessage:le.message});}
  return j;
}
