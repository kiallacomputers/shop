import {getAdminSupabase,requireSuperAdmin} from "~~/server/utils/adminAuth";
export default defineEventHandler(async e=>{await requireSuperAdmin(e);const{data,error}=await getAdminSupabase().from('accounting_cash_flow_items').select('*').order('active',{ascending:false}).order('start_date');if(error)throw createError({statusCode:500,statusMessage:error.message});return data||[]});
