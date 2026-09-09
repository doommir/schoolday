import {installPrivacySchema} from './helpers/privacy-schema.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const sql=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
installPrivacySchema(sql);
class Stmt{constructor(q,args=[]){this.q=q;this.args=args}bind(...a){return new Stmt(this.q,a)}async first(){return sql.prepare(this.q).get(...this.args)||null}async all(){return {results:sql.prepare(this.q).all(...this.args)}}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}}}}
const DB={prepare:q=>new Stmt(q),async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
globalThis.__schooldayTest={env:{DB,APP_SECRET:'test-only',TEACHER_EMAILS:'owner@example.test'},headers:new Headers({'oai-authenticated-user-id':'adult-a','oai-authenticated-user-email':'a@example.test'}),cookies:{}};
await build({entryPoints:['lib/privacy-controls.ts','lib/billing-notices.ts','lib/paid-consent.ts','lib/server.ts','lib/search-discovery.ts'],bundle:true,platform:'node',format:'esm',outdir:'/tmp/schoolday-privacy-tests',alias:{'cloudflare:workers':path.resolve('tests/helpers/runtime.mjs'),'next/headers':path.resolve('tests/helpers/headers.mjs')}});
const p=await import('file:///tmp/schoolday-privacy-tests/privacy-controls.js');const b=await import('file:///tmp/schoolday-privacy-tests/billing-notices.js');
const a='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
sql.prepare('INSERT INTO accounts VALUES(?,?,?,?,?)').run('adult-a','a@example.test','Adult A','family',new Date().toISOString());
function seed(id,owner){sql.prepare('INSERT INTO profiles VALUES(?,?,?,?,?)').run(id,id,'Fixture',6,new Date().toISOString());sql.prepare('INSERT INTO account_learners VALUES(?,?,?)').run(id,owner,new Date().toISOString());}
test('consent is not verified by declaration; revocation and optional sharing are enforced',async()=>{
 await assert.rejects(p.requireConsent('adult-a'));
 await p.requestConsent({name:'Adult A',guardian:true,notice:true,squads:false});assert.equal((await p.consentFor('adult-a')).status,'pending');await assert.rejects(p.requireConsent('adult-a'));await assert.rejects(p.verifyConsent({accountId:'adult-a',method:'signed_form',reference:'Secure form reviewed today',confirmed:true}));
 globalThis.__schooldayTest.headers=new Headers({'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'});
 await p.verifyConsent({accountId:'adult-a',method:'signed_form',reference:'Secure form reviewed today',confirmed:true});await p.requireConsent('adult-a');await assert.rejects(p.requireConsent('adult-a',true));
 globalThis.__schooldayTest.headers=new Headers({'oai-authenticated-user-id':'adult-a','oai-authenticated-user-email':'a@example.test'});
 seed(a,'adult-a');await p.requireLearnerConsent(a);await p.revokeConsent();await assert.rejects(p.requireLearnerConsent(a));
});
test('deletion is owner scoped, cascades records, preserves peers and rejects late inserts',async()=>{
 seed(other,'adult-b');sql.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run('ev-a',a,'test','private','now');sql.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run('ev-b',other,'test','peer','now');
 sql.prepare("INSERT INTO days(id,profile_id,day_number,theme,question,status,created_at) VALUES('day-a',?,1,'Fixture','Question','ready','now')").run(a);
 sql.exec("INSERT INTO activities(id,day_id,subject,title,goal,prerequisite,minutes,position) VALUES('act-a','day-a','Math','Fixture','Goal','Prior',30,0)");
 sql.prepare("INSERT INTO rooms(code,host,activity_id,created_at) VALUES('ROOM01',?,'act-a','now')").run(a);
 sql.prepare("INSERT INTO room_responses(id,room_code,profile_id,stage,response) VALUES('response-b','ROOM01',?,0,'Peer discussion')").run(other);
 sql.prepare("INSERT INTO learning_state(profile_id,mode,room_code,updated_at) VALUES(?,'squad','ROOM01','now')").run(other);
 await assert.rejects(p.deleteLearner({id:other,confirmation:'DELETE'}));await assert.rejects(p.deleteLearner({id:a,confirmation:'no'}));
 assert.equal((await p.exportLearner(a)).events.length,1);await p.deleteLearner({id:a,confirmation:'DELETE'});
 assert.equal(sql.prepare('SELECT count(*) n FROM events WHERE profile_id=?').get(a).n,0);assert.equal(sql.prepare('SELECT count(*) n FROM events WHERE profile_id=?').get(other).n,1);assert(!sql.prepare('SELECT * FROM learner_lifecycle WHERE profile_id=?').get(a));
 assert.equal(sql.prepare('SELECT count(*) n FROM activities').get().n,0);assert.equal(sql.prepare('SELECT count(*) n FROM rooms').get().n,0);assert.equal(sql.prepare('SELECT count(*) n FROM room_responses').get().n,0);assert.equal(sql.prepare('SELECT mode FROM learning_state WHERE profile_id=?').get(other).mode,'solo');
 assert.throws(()=>sql.prepare("INSERT INTO rooms(code,host,activity_id,created_at) VALUES('LATE',?,'act-a','now')").run(a));
 assert.throws(()=>sql.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run('late',a,'test','late','now'));
});
test('retention refuses expired access and deletes expired records in bounded maintenance',async()=>{sql.prepare('UPDATE learner_lifecycle SET expires_at=0 WHERE profile_id=?').run(other);await assert.rejects(p.touchLearner(other));await p.retentionSweep();assert(!sql.prepare('SELECT id FROM profiles WHERE id=?').get(other));});
test('subscription notices are durable and idempotent without pretending email delivery',async()=>{
 const sub={id:'sub_test',created:Date.now()/1000,status:'active',items:{data:[{quantity:2,current_period_end:Date.now()/1000+86400}]}},price={amount:2900,interval:'month',intervalCount:1};
 await b.recordBillingNotice('adult-a',sub,price);await b.recordBillingNotice('adult-a',sub,price);await b.sendBillingNotices();const rows=sql.prepare('SELECT * FROM billing_notices').all();assert.equal(rows.length,1);assert.match(rows[0].body,/58.00/);assert.match(rows[0].body,/automatically/);assert.equal(rows[0].sent_at,null);
 await b.recordBillingNotice('adult-a',{...sub,cancel_at_period_end:true},price);assert.equal(sql.prepare('SELECT count(*) n FROM billing_notices').get().n,2);
});
test('paid parent verification requires the saved choices and an actual owned live card charge',async()=>{
 const paid=await import('file:///tmp/schoolday-privacy-tests/paid-consent.js');
 globalThis.__schooldayTest.env.STRIPE_SECRET_KEY='sk_live_fixture';
 await p.requestConsent({name:'Adult A',guardian:true,notice:true,squads:true});
 sql.prepare("INSERT INTO subscriptions(id,account_id,customer_id,plan,status,quantity,period_end,cancel_at_end,checked_at) VALUES('sub_parent','adult-a','cus_parent','family','active',1,9999999999,0,0)").run();
 const session={livemode:true,mode:'subscription',status:'complete',payment_status:'paid',amount_total:2900,consent:{terms_of_service:'accepted'},invoice:'in_parent',subscription:'sub_parent',customer:'cus_parent',client_reference_id:'adult-a',metadata:{schoolday_account:'adult-a',schoolday_consent:await paid.pendingConsentToken('adult-a')}};
 let type='card',refunded=0;const old=globalThis.fetch;
 globalThis.fetch=async url=>{const u=String(url);return Response.json(u.includes('/invoices/')?{id:'in_parent',status:'paid',livemode:true,amount_paid:2900,customer:'cus_parent',parent:{subscription_details:{subscription:'sub_parent'}}}:u.includes('/invoice_payments?')?{data:[{status:'paid',livemode:true,amount_paid:2900,invoice:'in_parent',payment:{type:'payment_intent',payment_intent:'pi_parent'}}]}:{status:'succeeded',livemode:true,amount_received:2900,customer:'cus_parent',latest_charge:{id:'ch_parent',paid:true,captured:true,amount:2900,amount_refunded:refunded,payment_method_details:{type},receipt_url:'https://receipt.example.test/card'}});};
 try{for(const patch of [{livemode:false},{amount_total:0},{payment_status:'no_payment_required'},{client_reference_id:'other'},{consent:{}},{metadata:{...session.metadata,schoolday_consent:'stale'}}])assert.equal(await paid.confirmPaidConsent('adult-a',{...session,...patch}),false);
 type='us_bank_account';assert.equal(await paid.confirmPaidConsent('adult-a',session),false);type='card';refunded=2900;assert.equal(await paid.confirmPaidConsent('adult-a',session),false);refunded=0;
 assert.equal(await paid.confirmPaidConsent('adult-a',session),true);await p.requireConsent('adult-a',true);assert.equal((await p.consentFor('adult-a')).method,'card_transaction');await p.revokeConsent();assert.equal(await paid.confirmPaidConsent('adult-a',session),false);
 }finally{globalThis.fetch=old;}
});
test('billing retries honor backoff and reuse the delivery idempotency key',async()=>{
 const server=await import('file:///tmp/schoolday-privacy-tests/server.js');
 sql.prepare("UPDATE billing_notices SET sent_at='fixture'").run();
 sql.prepare("INSERT INTO settings VALUES('email_config',?)").run(JSON.stringify({enabled:true,from:'sender@example.test'}));sql.prepare("INSERT INTO settings VALUES('email_key',?)").run(await server.seal('re_fixture_only'));
 await b.recordBillingNotice('adult-a',{id:'sub_retry',status:'active',items:{data:[{quantity:1}]}},{amount:2900,interval:'month'});
 let calls=0;const keys=[],old=globalThis.fetch;globalThis.fetch=async(_u,o)=>{calls++;keys.push(o.headers['Idempotency-Key']);return calls===1?new Response('{}',{status:429}):Response.json({id:'email_receipt'});};
 try{await b.sendBillingNotices();let row=sql.prepare("SELECT * FROM billing_notices WHERE subscription_id='sub_retry'").get();assert.equal(row.attempts,1);assert.equal(row.sent_at,null);assert(row.next_attempt>Date.now());await b.sendBillingNotices();assert.equal(calls,1);sql.prepare("UPDATE billing_notices SET next_attempt=0 WHERE subscription_id='sub_retry'").run();await b.sendBillingNotices();row=sql.prepare("SELECT * FROM billing_notices WHERE subscription_id='sub_retry'").get();assert.equal(row.provider_id,'email_receipt');assert(row.sent_at);assert.equal(keys[0],keys[1]);await b.sendBillingNotices();assert.equal(calls,2);}finally{globalThis.fetch=old;}
});
test('search discovery submits public canonical URLs once and backs off pending verification',async()=>{
 const search=await import('file:///tmp/schoolday-privacy-tests/search-discovery.js');const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async(u,o)=>{calls++;assert.equal(u,'https://api.indexnow.org/indexnow');const b=JSON.parse(o.body);assert(b.urlList.every(s=>!s.includes('?')&&!s.includes('/api/')&&!s.includes('privacy')));assert(b.urlList.some(s=>s.endsWith('middle-school-math-check-at-home')));return new Response('',{status:calls===1?202:200});};
 try{await search.notifySearchEngines();assert.equal((await search.searchDiscoveryStatus()).status,'verification pending');await search.notifySearchEngines();assert.equal(calls,1);const s=await search.searchDiscoveryStatus();s.nextAt=0;sql.prepare("UPDATE settings SET value=? WHERE id='search_discovery'").run(JSON.stringify(s));await search.notifySearchEngines();assert.equal((await search.searchDiscoveryStatus()).status,'submitted');await search.notifySearchEngines();assert.equal(calls,2);}finally{globalThis.fetch=old;}
});
