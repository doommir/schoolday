import {confirmPaidConsent} from './paid-consent';
import {billingConfig,stripe,syncSubscription} from './billing';
import {db,HttpError,now,runtime,seal,setting,uid} from './server';

async function verify(raw:string,header:string,secret:string){
 const parts=header.split(',').map(p=>p.trim().split('=')),timestamp=parts.find(p=>p[0]==='t')?.[1],signatures=parts.filter(p=>p[0]==='v1').map(p=>p[1]);
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300||!signatures.length||signatures.length>10)throw new HttpError('Invalid payment signature.',400);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const message=new TextEncoder().encode(timestamp+'.'+raw);
 for(const sig of signatures){if(!/^[a-f0-9]{64}$/.test(sig))continue;const bytes=Uint8Array.from(sig.match(/../g)!,b=>parseInt(b,16));if(await crypto.subtle.verify('HMAC',key,bytes,message))return;}
 throw new HttpError('Invalid payment signature.',400);
}
const idOf=(v:any)=>typeof v==='string'?v:v?.id;
export async function paymentWebhook(req:Request){
 const encrypted=await setting('stripe_webhook_secret'),secret=encrypted?await seal(encrypted,true):runtime().STRIPE_WEBHOOK_SECRET;
 if(!secret)throw new HttpError('Payment events are not configured.',503);
 if(Number(req.headers.get('content-length')||0)>262144)throw new HttpError('Event is too large.',413);
 const raw=await req.text();if(raw.length>262144)throw new HttpError('Event is too large.',413);await verify(raw,req.headers.get('stripe-signature')||'',secret);
 let event:any;try{event=JSON.parse(raw)}catch{throw new HttpError('Invalid payment event.');}
 if(!/^evt_[A-Za-z0-9]+$/.test(event.id)||typeof event.type!=='string'||typeof event.livemode!=='boolean'||!event.data?.object)throw new HttpError('Invalid payment event.');
 const config=await billingConfig();if(!config||event.livemode!==(config.mode==='live'))throw new HttpError('Payment event mode does not match.',400);
 const token=uid();await db().prepare("INSERT OR IGNORE INTO payment_events(id,type,livemode,status,created_at) VALUES(?,?,?,'pending',?)").bind(event.id,event.type,event.livemode?1:0,now()).run();
 const prior=await db().prepare('SELECT status FROM payment_events WHERE id=?').bind(event.id).first();if(prior&&['complete','ignored'].includes(String(prior.status)))return {received:true,duplicate:true};
 const lock=await db().prepare("UPDATE payment_events SET status='processing',lease=?,token=?,error=NULL WHERE id=? AND lease<? AND status IN ('pending','error','processing')").bind(Date.now()+90000,token,event.id,Date.now()).run();if(!lock.meta.changes)throw new HttpError('Payment event is already processing.',409);
 try{
  let handled=false;const object=event.data.object;
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
   const attempt=await db().prepare('SELECT * FROM checkout_attempts WHERE session_id=?').bind(object.id).first();
   if(attempt){const latest=await db().prepare('SELECT session_id FROM checkout_attempts WHERE account_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').bind(attempt.account_id).first();if(latest?.session_id===attempt.session_id){
    const session=await stripe('checkout/sessions/'+encodeURIComponent(String(attempt.session_id)));
    if(session.client_reference_id!==attempt.account_id||session.metadata?.schoolday_account!==attempt.account_id)throw new HttpError('Checkout ownership mismatch.',403);
    if(session.status==='complete'&&['paid','no_payment_required'].includes(session.payment_status)&&idOf(session.subscription)){await syncSubscription(String(attempt.account_id),idOf(session.subscription),config);await confirmPaidConsent(String(attempt.account_id),session);handled=true;}
   }}
  }else if(['invoice.paid','invoice.payment_failed'].includes(event.type)){
   const subId=idOf(object.parent?.subscription_details?.subscription);
   if(subId){const linked=await db().prepare('SELECT account_id FROM subscriptions WHERE id=?').bind(subId).first();if(linked){await syncSubscription(String(linked.account_id),subId,config);handled=true;}}
  }else if(['customer.subscription.updated','customer.subscription.deleted','customer.subscription.created'].includes(event.type)){
   const linked=await db().prepare('SELECT account_id FROM subscriptions WHERE id=?').bind(object.id).first();
   if(linked){await syncSubscription(String(linked.account_id),String(object.id),config);handled=true;}
  }
  await db().prepare('UPDATE payment_events SET status=?,lease=0,token=NULL WHERE id=? AND token=?').bind(handled?'complete':'ignored',event.id,token).run();
  return {received:true};
 }catch(e){await db().prepare("UPDATE payment_events SET status='error',error=?,lease=0,token=NULL WHERE id=? AND token=?").bind(e instanceof HttpError?e.message:'Payment synchronization failed. Stripe can retry.',event.id,token).run();throw e;}
}
