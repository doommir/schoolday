import {installPrivacySchema} from './helpers/privacy-schema.mjs';
import {installConsentFixtures} from './helpers/consent-fixtures.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const sql=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
installPrivacySchema(sql);
installConsentFixtures(sql);
class Prepared{constructor(q,args=[]){this.q=q;this.args=args}bind(...args){return new Prepared(this.q,args)}async first(){return sql.prepare(this.q).get(...this.args)||null}async all(){return {results:sql.prepare(this.q).all(...this.args)}}async run(){return {meta:{changes:Number(sql.prepare(this.q).run(...this.args).changes)}}}}
const DB={prepare:q=>new Prepared(q),async batch(stmts){sql.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};
const state=globalThis.__schooldayTest={env:{DB,APP_SECRET:'test-secret',TEACHER_EMAILS:'owner@example.test',OPENAI_API_KEY:'test-generation-key'},headers:new Headers(),cookies:{}};
await build({entryPoints:['app/api/[action]/route.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-entry-test.mjs',alias:{'cloudflare:workers':path.join(process.cwd(),'tests/helpers/runtime.mjs'),'next/headers':path.join(process.cwd(),'tests/helpers/headers.mjs')}});
const {GET,POST}=await import('file:///tmp/schoolday-entry-test.mjs');
async function call(action,body){const r=await(body===undefined?GET:POST)(new Request('https://schoolday.test/api/'+action,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://schoolday.test'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({action:action.split('?')[0]})});return {status:r.status,data:await r.json()};}
function who(id,email){state.headers=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{});}
const setup={name:'River',grade:7,pin:'641823',adult:true};
const save=(id,value)=>sql.prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(id,value);
let learner;
test('guided family entry protects identity and resumes without duplicate learners',async t=>{
 await t.test('public closed access collects no learner data and grants no license',async()=>{
  who(null);const initial=await call('family-entry');assert.equal(initial.status,200);assert.equal(initial.data.canBuy,false);assert.deepEqual(initial.data.learners,[]);assert.equal((await call('family-onboard',setup)).status,401);
  who('parent','parent@example.test');assert.equal((await call('family-onboard',setup)).status,409);assert.equal(sql.prepare('SELECT count(*) n FROM profiles').get().n,0);assert.equal(sql.prepare('SELECT count(*) n FROM accounts').get().n,0);
 });
 await t.test('an invited family saves one adult, PIN, and grade-specific learner',async()=>{
  save('pilot_emails',JSON.stringify(['parent@example.test','other@example.test','legacy@example.test']));
  await call('account-setup',{name:'Fixture parent',kind:'family',adult:true});
  assert.equal((await call('family-onboard',{...setup,grade:5})).status,400);assert.equal((await call('family-onboard',{...setup,adult:false})).status,400);assert.equal((await call('family-onboard',{name:'River',grade:7,adult:true})).status,400);
  const r=await call('family-onboard',setup);assert.equal(r.status,200,JSON.stringify(r));learner=r.data.profile;assert.equal(learner.grade,7);assert.equal(learner.name,'River');assert.match(r.data.recovery,/^[A-F0-9]{32}$/);
  const entry=(await call('family-entry')).data;assert.equal(entry.pinSet,true);assert.equal(entry.pilot,true);assert.equal(entry.entitlement.licensed,false);assert.equal(entry.learners[0].canBegin,true);assert(!JSON.stringify(entry).includes('pin_hash'));assert(!JSON.stringify(entry).includes(r.data.recovery));
 });
 await t.test('retry resumes the same learner without resetting PIN or grade',async()=>{
  const digest=sql.prepare('SELECT pin_hash FROM adult_security WHERE account_id=?').get('parent').pin_hash;
  const retry=await call('family-onboard',{...setup,name:'Different',grade:8,pin:'111111'});assert.equal(retry.status,200);assert.equal(retry.data.profile.id,learner.id);assert.equal(retry.data.profile.grade,7);assert.equal(retry.data.recovery,null);assert.equal(sql.prepare('SELECT count(*) n FROM profiles').get().n,1);assert.equal(sql.prepare('SELECT pin_hash FROM adult_security WHERE account_id=?').get('parent').pin_hash,digest);
 });
 await t.test('starting learning locks adult controls and preserves the selected learner session',async()=>{
  assert.equal((await call('select-learner',{id:learner.id})).status,200);assert.equal((await call('status')).data.profile.id,learner.id);
  const locked=(await call('family-entry')).data;assert.equal(locked.locked,true);assert.equal(locked.account,null);assert.deepEqual(locked.learners,[]);assert.equal((await call('family-onboard',setup)).status,423);
  assert.equal((await call('adult-unlock',{pin:'641823'})).status,200);assert.equal((await call('family-entry')).data.learners[0].id,learner.id);
 });
 await t.test('a different adult cannot select the first family learner',async()=>{
  who('other','other@example.test');state.cookies={};await call('account-setup',{name:'Fixture other',kind:'family',adult:true});const r=await call('family-onboard',{...setup,name:'Sky',grade:6});assert.equal(r.status,200);assert.notEqual(r.data.profile.id,learner.id);assert.equal((await call('select-learner',{id:learner.id})).status,404);const entry=(await call('family-entry')).data;assert.equal(entry.learners.length,1);assert.equal(entry.learners[0].name,'Sky');
 });
 await t.test('an existing family can add a PIN without replacing its learner',async()=>{
  who('legacy','legacy@example.test');state.cookies={};assert.equal((await call('account-setup',{name:'Existing family',kind:'family',adult:true})).status,200);const old=(await call('profile',{name:'Existing learner',grade:8})).data.profile;
  const r=await call('family-onboard',setup);assert.equal(r.status,200);assert.equal(r.data.profile.id,old.id);assert.equal(r.data.profile.grade,8);assert(r.data.recovery);assert.equal((await call('family-entry')).data.pinSet,true);
 });
 await t.test('ending pilot invitation removes generation access but preserves owned records',async()=>{
  assert.equal((await call('plan',{})).status,200);
  save('pilot_emails','[]');const entry=(await call('family-entry')).data;assert.equal(entry.canBegin,false);assert.equal(entry.entitlement.active,false);assert.equal(entry.learners.length,1);assert.equal(entry.learners[0].canBegin,false);assert.equal(entry.learners[0].canResume,true);
  const saved=(await call('day')).data;assert.equal(saved.canPrepare,false);assert.equal(saved.activities.length,9);
  const arrival=saved.activities.find(a=>a.subject==='Arrival');assert.equal((await call('answer',{id:arrival.id,stage:0,response:'My saved day is still open for learning.'})).status,200);
  assert.equal((await call('plan',{next:true})).status,402);
  const next=(await call('year-next?preparedOnly=1')).data.activity;assert.equal(next.status,'ready');assert.notEqual(next.id,saved.activities.find(a=>a.subject==='Math').id);
  save('pilot_emails',JSON.stringify(['legacy@example.test']));const key=state.env.OPENAI_API_KEY;delete state.env.OPENAI_API_KEY;
  try{const outage=(await call('family-entry')).data;assert.equal(outage.learners[0].canBegin,false);assert.equal(outage.learners[0].canResume,true);assert.equal((await call('day')).data.canPrepare,false);assert.equal((await call('resume?id='+arrival.id)).data.evidence.length,1);}
  finally{state.env.OPENAI_API_KEY=key;save('pilot_emails','[]');}

 });
});

test('live Stripe bootstrap verifies the requested account before mutation and survives retries',async t=>{
 const input={key:'rk_live_fake_test_fixture_only',privacyUrl:'https://schoolday.test/privacy',termsUrl:'https://schoolday.test/terms',supportEmail:'help@example.test'};
 let email='wrong@example.test',charges=true,price=null,failPortal=false;const requests=[];
 globalThis.fetch=async(url,opts={})=>{const u=new URL(url);assert.equal(u.origin,'https://api.stripe.com');assert.equal(opts.headers['Stripe-Version'],'2026-08-26.dahlia');const route=u.pathname.slice(4),body=Object.fromEntries(new URLSearchParams(opts.body||''));requests.push({route,body,method:opts.method,idempotency:opts.headers['Idempotency-Key']});
  if(route==='account')return Response.json({id:'acct_expected',email,charges_enabled:charges,payouts_enabled:true});
  if(route==='prices'&&opts.method==='GET'){assert.match(u.searchParams.get('lookup_keys[]'),/^schoolday_family_29_month_/);return Response.json({data:price?[price]:[]});}
  if(route==='prices'&&opts.method==='POST'){price={id:'price_familylive',product:'prod_familylive',currency:body.currency,unit_amount:Number(body.unit_amount),active:true,livemode:true,type:'recurring',billing_scheme:'per_unit',recurring:{interval:body['recurring[interval]'],interval_count:Number(body['recurring[interval_count]']),usage_type:body['recurring[usage_type]']}};return Response.json(price);}
  if(route==='prices/price_familylive')return Response.json(price);
  if(route==='billing_portal/configurations'){if(failPortal)return Response.json({error:{}},{status:503});return Response.json({id:'bpc_familylive'});}
  if(route==='webhook_endpoints')return Response.json({id:'we_familylive',secret:'whsec_fake_fixture_only'});
  throw Error('Unexpected Stripe path '+route);
 };
 await t.test('anonymous and ordinary family accounts cannot configure live Stripe',async()=>{who(null);assert.equal((await call('stripe-setup',input)).status,403);who('other','other@example.test');assert.equal((await call('stripe-setup',input)).status,403);assert.equal(requests.length,0);});
 await t.test('wrong account or disabled charges block all Stripe writes',async()=>{who('owner','owner@example.test');state.cookies={};assert.equal((await call('stripe-setup',input)).status,409);email='novapath711@gmail.com';charges=false;assert.equal((await call('stripe-setup',input)).status,409);assert.equal(requests.filter(r=>r.method==='POST').length,0);assert.equal(sql.prepare("SELECT value FROM settings WHERE id='stripe_setup_lock'").get(),undefined);});
 await t.test('partial provider failure does not save an incomplete billing connection',async()=>{charges=true;failPortal=true;assert.equal((await call('stripe-setup',input)).status,502);assert.equal(sql.prepare("SELECT value FROM settings WHERE id='billing_config'").get(),undefined);assert.equal(requests.filter(r=>r.route==='prices'&&r.method==='POST').length,1);});
 await t.test('retry reuses the created price, encrypts secrets, and configures cancellation plus payment updates',async()=>{failPortal=false;const r=await call('stripe-setup',input);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.accountEmail,email);assert.equal(r.data.catalog.mode,'live');assert.equal(r.data.catalog.prices.family.amount,2900);assert.equal(r.data.catalog.organizationPrice,undefined);assert.equal(requests.filter(r=>r.route==='prices'&&r.method==='POST').length,1);assert.equal(requests.find(r=>r.route==='billing_portal/configurations').body['features[subscription_cancel][mode]'],'at_period_end');assert.equal(requests.find(r=>r.route==='webhook_endpoints').body.url,'https://schoolday.test/api/payment-webhook');assert(!JSON.stringify(r.data).includes(input.key));assert.notEqual(sql.prepare("SELECT value FROM settings WHERE id='stripe_key'").get().value,input.key);assert.notEqual(sql.prepare("SELECT value FROM settings WHERE id='stripe_webhook_secret'").get().value,'whsec_fake_fixture_only');assert.equal((await call('family-entry')).data.canBuy,false);});
 await t.test('repeat setup creates neither a duplicate price nor a second webhook',async()=>{assert.equal((await call('stripe-setup',input)).status,200);assert.equal(requests.filter(r=>r.route==='prices'&&r.method==='POST').length,1);assert.equal(requests.filter(r=>r.route==='webhook_endpoints').length,1);});
});
