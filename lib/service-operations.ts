import {notifySearchEngines,searchDiscoveryStatus} from './search-discovery';
import {requireOperator} from './accounts';
import {db,setting,now,putSetting} from './server';
import {retentionSweep} from './privacy-controls';
import {sendBillingNotices} from './billing-notices';
async function serviceStatus() {
  await requireOperator();
  const email = JSON.parse(await setting("email_config") || "null");
  return { search:await searchDiscoveryStatus(),emailReady: !!email?.enabled && !!await setting("email_key"), lastRun: await setting("service_last_run"), pendingConsent: Number((await db().prepare("SELECT count(*) n FROM family_consents WHERE status='pending'").first())?.n || 0), notices: (await db().prepare("SELECT id,kind,created_at,sent_at,error,attempts,next_attempt FROM billing_notices ORDER BY created_at DESC LIMIT 20").all()).results, paymentErrors: Number((await db().prepare("SELECT count(*) n FROM payment_events WHERE status='error'").first())?.n || 0) };
}
async function serviceMaintenance() {
  await notifySearchEngines();
  await retentionSweep();
  await sendBillingNotices();
  await putSetting("service_last_run", now());
}
async function runServiceMaintenance() {
  await requireOperator();
  await serviceMaintenance();
  return serviceStatus();
}


export {serviceStatus,serviceMaintenance,runServiceMaintenance};
