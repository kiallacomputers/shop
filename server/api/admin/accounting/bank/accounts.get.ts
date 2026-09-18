import {getAdminSupabase,requireSuperAdmin} from "~~/server/utils/adminAuth";
export default defineEventHandler(async e=>{await requireSuperAdmin(e);const s=getAdminSupabase();const {data,error}=await s.from("accounting_bank_accounts").select("*,accounting_accounts(id,code,name)").order("name");if(error)throw createError({statusCode:500,statusMessage:error.message});return data||[]});
