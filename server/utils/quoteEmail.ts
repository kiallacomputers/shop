import { escapeHtml, sendDomainEmail } from "~~/server/utils/domainEmail";
import { createQuotePdf, getQuoteFilename } from "~~/server/utils/quotePdf";

type QuoteItem = { product_name:string; variant_name?:string|null; product_code?:string|null; quantity:number; requested_price?:number|null; quoted_price?:number|null };
type QuoteEmailData = { id:string|number; quote_number?:string|null; customer_email:string; customer_name?:string|null; customer_message?:string|null; quoted_total?:number|null; created_at?:string|null; expires_at?:string|null; items:QuoteItem[]; accountUrl?:string|null };

const money=(v:unknown)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(v||0));
const number=(q:QuoteEmailData)=>q.quote_number||`KCQ-${String(q.id).padStart(6,"0")}`;
const fmtDate=(v?:string|null)=>v?new Intl.DateTimeFormat("en-AU",{day:"2-digit",month:"short",year:"numeric",timeZone:"Australia/Melbourne"}).format(new Date(v)):"";
const itemRows=(q:QuoteEmailData,quoted=false)=>q.items.map(i=>{const unit=quoted?Number(i.quoted_price??i.requested_price??0):Number(i.requested_price??0);return `<tr><td style="padding:12px;border-bottom:1px solid #e2e8f0;"><strong>${escapeHtml(i.product_name)}</strong>${i.variant_name?`<div style="font-size:12px;color:#64748b;">${escapeHtml(i.variant_name)}</div>`:""}${i.product_code?`<div style="font-size:12px;color:#64748b;">Code: ${escapeHtml(i.product_code)}</div>`:""}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(i.quantity||1)}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(unit)}</td><td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${money(unit*Number(i.quantity||1))}</td></tr>`}).join("");
const shell=(title:string,subtitle:string,body:string)=>`<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><div style="max-width:720px;margin:0 auto;padding:32px 16px;"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;"><div style="padding:28px;background:#0f172a;color:#fff;"><h1 style="margin:0;font-size:24px;">${escapeHtml(title)}</h1><p style="margin:8px 0 0;color:#cbd5e1;">${escapeHtml(subtitle)}</p></div><div style="padding:28px;">${body}</div></div></div></body></html>`;
const sellerAddress=()=>String(process.env.QUOTE_NOTIFICATION_EMAIL||process.env.ORDER_NOTIFICATION_EMAIL||process.env.MICROSOFT_SENDER_EMAIL||useRuntimeConfig().microsoftSenderEmail||"").trim();

export async function sendQuoteRequestEmails(q:QuoteEmailData){
 const name=q.customer_name?.trim()||"Customer";
 const quoteNo=number(q);
 const table=`<table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;"><thead><tr style="background:#f1f5f9;"><th style="padding:12px;text-align:left;">Product</th><th style="padding:12px;text-align:center;">Qty</th><th style="padding:12px;text-align:right;">Requested price</th><th style="padding:12px;text-align:right;">Subtotal</th></tr></thead><tbody>${itemRows(q)}</tbody></table>`;
 const customerHtml=shell("Kialla Computers",`Quote request ${quoteNo} received`, `<p>Hi ${escapeHtml(name)},</p><p>Thanks for requesting a quote. We have received your request and will review it shortly.</p>${table}${q.customer_message?`<div style="margin-top:18px;padding:14px;background:#f8fafc;border-radius:8px;"><strong>Your message</strong><div style="margin-top:6px;">${escapeHtml(q.customer_message).replaceAll("\n","<br>")}</div></div>`:""}<p style="margin-top:24px;">You can check the status from <strong>My Account</strong>.</p><p style="margin-bottom:0;">Regards,<br><strong>Kialla Computers</strong></p>`);
 const sellerHtml=shell("New Quote Request",quoteNo, `<p><strong>Customer:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(q.customer_email)}</p>${q.customer_message?`<p><strong>Customer message:</strong><br>${escapeHtml(q.customer_message).replaceAll("\n","<br>")}</p>`:""}${table}<p style="margin-top:24px;">Open Quote Management in Admin to review and price this quote.</p>`);
 const result={customerSent:false,sellerSent:false};
 await sendDomainEmail({to:{address:q.customer_email,name:q.customer_name},subject:`Kialla Computers - Quote request ${quoteNo} received`,html:customerHtml}); result.customerSent=true;
 const seller=sellerAddress(); if(seller){await sendDomainEmail({to:{address:seller,name:"Kialla Computers"},subject:`New quote request ${quoteNo} - ${name}`,html:sellerHtml,replyTo:[{address:q.customer_email,name:q.customer_name}]});result.sellerSent=true}
 return result;
}

export async function sendQuoteReadyEmail(q:QuoteEmailData){
 const name=q.customer_name?.trim()||"Customer";
 const quoteNo=number(q);
 const total=Number(q.quoted_total??q.items.reduce((s,i)=>s+Number(i.quoted_price??i.requested_price??0)*Number(i.quantity||1),0));
 const button=q.accountUrl?`<p style="margin:24px 0;"><a href="${escapeHtml(q.accountUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">View Quote / Pay Now</a></p>`:"";
 const expiry=q.expires_at?`<p style="padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;"><strong>Quote valid until ${escapeHtml(fmtDate(q.expires_at))}</strong></p>`:"";
 const html=shell("Your Quote Is Ready",`Kialla Computers ${quoteNo}`, `<p>Hi ${escapeHtml(name)},</p><p>Your quote has now been prepared.</p>${expiry}<table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;"><thead><tr style="background:#f1f5f9;"><th style="padding:12px;text-align:left;">Product</th><th style="padding:12px;text-align:center;">Qty</th><th style="padding:12px;text-align:right;">Quoted price</th><th style="padding:12px;text-align:right;">Subtotal</th></tr></thead><tbody>${itemRows(q,true)}</tbody></table><div style="margin-top:22px;text-align:right;font-size:20px;"><strong>Quoted Total: ${money(total)}</strong></div>${button}<p>A PDF copy of the quote is attached. You can also sign in to My Account to review and pay.</p><p style="margin-bottom:0;">Regards,<br><strong>Kialla Computers</strong></p>`);
 const pdf=createQuotePdf(q);
 return await sendDomainEmail({to:{address:q.customer_email,name:q.customer_name},subject:`Kialla Computers - ${quoteNo} is ready`,html,attachments:[{name:getQuoteFilename(q),contentType:"application/pdf",content:pdf}]});
}
