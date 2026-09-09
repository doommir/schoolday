import {db,hash,now,seal,setting} from './server';
import {account,requireOperator} from './accounts';
import {business} from './business';
async function recordBillingNotice(aid:any, subscription:any, price:any) {
  const anniversary = Math.floor((Date.now() / 1e3 - Number(subscription.created || Date.now() / 1e3)) / (365 * 86400));
  const item = subscription.items?.data?.[0], quantity = Number(item?.quantity || 1), periodEnd = Number(item?.current_period_end || subscription.current_period_end || 0);
  const state = subscription.status + ":" + Boolean(subscription.cancel_at_period_end) + ":" + quantity;
  const id = subscription.id + ":" + periodEnd + ":" + anniversary + ":" + state;
  const total = (price.amount * quantity / 100).toFixed(2);
  const body = `Schoolday OS subscription confirmation / reminder

$${total} USD every ${price.intervalCount || 1} ${price.interval}(s) for ${quantity} learner(s), plus any taxes shown on your invoice. Status: ${subscription.status}. ${subscription.cancel_at_period_end ? "Cancellation is scheduled; this subscription will not renew." : "This subscription renews automatically until canceled."}
Current period ends: ${periodEnd ? new Date(periodEnd * 1e3).toISOString().slice(0, 10) : "See your Stripe invoice"}.
Cancel online at ${business.origin}/?adult=billing by opening Manage subscription. No phone call is required. Cancellation stops future renewal and access continues through the paid period.
Subscription terms: ${business.termsUrl}
Help: ${business.supportEmail}
${business.name}, ${business.address}

This is a service notice, not marketing.`;
  await db().prepare("INSERT OR IGNORE INTO billing_notices(id,account_id,subscription_id,kind,body,created_at) VALUES(?,?,?,?,?,?)").bind(id, aid, subscription.id, anniversary ? "renewal_reminder" : "subscription_confirmation", body, now()).run();
}
async function sendBillingNotices() {
  const c2 = JSON.parse(await setting("email_config") || "null"), key2 = await setting("email_key");
  if (!c2?.enabled || !key2) return;
  const rows = (await db().prepare("SELECT n.*,a.email FROM billing_notices n JOIN accounts a ON a.id=n.account_id WHERE n.sent_at IS NULL AND n.lease<? AND n.next_attempt<=? AND (n.error IS NULL OR (n.error NOT LIKE 'Needs attention:%' AND n.error!='Delivery uncertain; review provider before resending')) ORDER BY n.created_at LIMIT 3").bind(Date.now(), Date.now()).all()).results;
  for (const n of rows) {
    if (Number(n.attempts) >= 8 || Number(n.first_attempt) > 0 && Date.now() - Number(n.first_attempt) > 23 * 36e5) {
      await db().prepare("UPDATE billing_notices SET error='Needs attention: retry window ended; inspect provider delivery before resending' WHERE id=? AND sent_at IS NULL").bind(n.id).run();
      continue;
    }
    const lease = Date.now() + 6e4;
    const lock = await db().prepare("UPDATE billing_notices SET lease=?,attempts=attempts+1,first_attempt=CASE WHEN first_attempt=0 THEN ? ELSE first_attempt END WHERE id=? AND sent_at IS NULL AND lease<? AND next_attempt<=? AND attempts=?").bind(lease, Date.now(), n.id, Date.now(), Date.now(), n.attempts).run();
    if (!lock.meta.changes) continue;
    let retry = true;
    try {
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + await seal(key2, true), "Content-Type": "application/json", "Idempotency-Key": "billing-" + await hash(String(n.id)) }, body: JSON.stringify({ from: c2.from, to: [n.email], reply_to: business.supportEmail, subject: "Your Schoolday subscription", text: n.body }), signal: AbortSignal.timeout(12e3) });
      if (!r.ok) {
        retry = r.status === 429 || r.status >= 500;
        throw Error("provider");
      }
      const receipt = await r.json() as any;
      if (!receipt.id) throw Error("missing receipt");
      await db().prepare("UPDATE billing_notices SET sent_at=?,provider_id=?,error=NULL,lease=0,next_attempt=0 WHERE id=? AND lease=?").bind(now(), receipt.id, n.id, lease).run();
    } catch {
      await db().prepare("UPDATE billing_notices SET error=?,lease=0,next_attempt=? WHERE id=? AND lease=?").bind(retry ? "Retry pending: delivery not yet confirmed" : "Needs attention: email provider rejected the sender or request", Date.now() + Math.min(36e5, 6e4 * 2 ** Number(n.attempts)), n.id, lease).run();
    }
  }
}
async function billingNoticeInbox() {
  const a = await account();
  return { notices: (await db().prepare("SELECT id,kind,body,created_at,sent_at FROM billing_notices WHERE account_id=? ORDER BY created_at DESC LIMIT 30").bind(a!.id).all()).results };
}
async function billingNoticeStatus() {
  await requireOperator();
  return { notices: (await db().prepare("SELECT id,kind,created_at,sent_at,error,attempts,next_attempt FROM billing_notices ORDER BY created_at DESC LIMIT 30").all()).results };
}


export {recordBillingNotice,sendBillingNotices,billingNoticeInbox,billingNoticeStatus};
