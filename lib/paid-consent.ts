import {consentFor,noticeVersion} from './privacy-controls';
import {db,hash,HttpError,now} from './server';
import {stripe} from './billing';

var idOf = (v:any) => typeof v === "string" ? v : v?.id;
async function tokenFor(aid:any,c2:any) {
  return hash(JSON.stringify([aid, c2.version, c2.requested_at, c2.squads]));
}
async function pendingConsentToken(aid:any) {
  const c2 = await consentFor(aid);
  if (c2?.status !== "pending" || c2.version !== noticeVersion) throw new HttpError("Save your parental consent choices before subscribing to verify them.", 409);
  return tokenFor(aid, c2);
}
async function confirmPaidConsent(aid:any,s:any) {
  if (!s.metadata?.schoolday_consent) return false;
  const c2 = await consentFor(aid);
  if (c2?.status !== "pending" || c2.version !== noticeVersion) return false;
  if (s.metadata.schoolday_account !== aid || s.client_reference_id !== aid || s.metadata.schoolday_consent !== await tokenFor(aid, c2)) return false;
  if (s.livemode !== true || s.mode !== "subscription" || s.status !== "complete" || s.payment_status !== "paid" || Number(s.amount_total) <= 0 || s.consent?.terms_of_service !== "accepted" || !idOf(s.invoice)) return false;
  const linked = await db().prepare("SELECT id,customer_id FROM subscriptions WHERE account_id=?").bind(aid).first();
  if (!linked || linked.id !== idOf(s.subscription) || linked.customer_id !== idOf(s.customer)) return false;
  const invoice = await stripe("invoices/" + encodeURIComponent(idOf(s.invoice)));
  if (invoice.status !== "paid" || invoice.livemode !== true || invoice.amount_paid <= 0 || idOf(invoice.customer) !== linked.customer_id || idOf(invoice.parent?.subscription_details?.subscription) !== linked.id) return false;
  const payments = await stripe("invoice_payments?invoice=" + encodeURIComponent(invoice.id) + "&status=paid&limit=10");
  for (const payment of payments.data || []) {
    if (payment.status !== "paid" || payment.livemode !== true || payment.amount_paid <= 0 || idOf(payment.invoice) !== invoice.id || payment.payment?.type !== "payment_intent") continue;
    const pi = await stripe("payment_intents/" + encodeURIComponent(idOf(payment.payment.payment_intent)) + "?expand[]=latest_charge");
    const charge = pi.latest_charge;
    if (pi.status !== "succeeded" || pi.livemode !== true || pi.amount_received <= 0 || idOf(pi.customer) !== linked.customer_id || !charge || charge.paid !== true || charge.captured !== true || charge.amount <= 0 || charge.amount_refunded > 0 || charge.disputed || charge.payment_method_details?.type !== "card" || !charge.receipt_url) continue;
    const r = await db().prepare("UPDATE family_consents SET status='verified',verified_at=?,verified_by='stripe_transaction',method='card_transaction',reference=? WHERE account_id=? AND status='pending' AND version=? AND requested_at=? AND squads=?").bind(now(), charge.id, aid, noticeVersion, c2.requested_at, c2.squads).run();
    return !!r.meta.changes;
  }
  return false;
}


export {pendingConsentToken,confirmPaidConsent};
