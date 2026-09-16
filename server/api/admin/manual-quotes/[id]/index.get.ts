import { requireAdmin } from "~~/server/utils/adminAuth"; import { loadManualQuote } from "~~/server/utils/manualQuote";
export default defineEventHandler(async(event)=>{await requireAdmin(event);return loadManualQuote(String(getRouterParam(event,"id")||""));});
