export const moneyRound=(v:any)=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
export function poFreight(po:any){const actual=po?.freight_actual_ex_gst;return actual===null||actual===undefined?moneyRound(po?.freight_estimated_ex_gst):moneyRound(actual)}
export function freightAllocationForLine(po:any,line:any){
 const stock=(po?.accounting_purchase_order_lines||[]).filter((x:any)=>x.product_id);
 const base=stock.reduce((s:number,x:any)=>s+Number(x.quantity||0)*Number(x.unit_cost_ex_gst||0),0);
 if(base<=0)return 0;
 const lineBase=Number(line.quantity||0)*Number(line.unit_cost_ex_gst||0);
 return moneyRound(poFreight(po)*(lineBase/base));
}
export function landedUnitCost(po:any,line:any){
 const qty=Number(line.quantity||0); const supplier=Number(line.unit_cost_ex_gst||0);
 if(qty<=0)return supplier;
 return Math.round((supplier+freightAllocationForLine(po,line)/qty+Number.EPSILON)*10000)/10000;
}
