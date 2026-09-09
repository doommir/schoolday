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
const DB={prepare:q=>new Prepared(q),async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
const state=globalThis.__schooldayTest={env:{DB,APP_SECRET:'test-secret',TEACHER_EMAILS:'owner@example.test'},headers:new Headers(),cookies:{}};
await build({stdin:{contents:"export {GET,POST} from './app/api/[action]/route';export {syncPipelineForAccount} from './lib/pipeline';export {campaignHref} from './lib/pipeline-content';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-pipeline-test.mjs',alias:{'cloudflare:workers':path.join(process.cwd(),'tests/helpers/runtime.mjs'),'next/headers':path.join(process.cwd(),'tests/helpers/headers.mjs')}});
const {GET,POST,syncPipelineForAccount,campaignHref}=await import('file:///tmp/schoolday-pipeline-test.mjs');
async function call(action,body){const r=await(body===undefined?GET:POST)(new Request('https://schoolday.test/api/'+action,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://schoolday.test'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({action})});return {status:r.status,data:await r.json()};}
function who(owner=true){state.headers=new Headers(owner?{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}:{});}
const resources={'contact-properties':[],events:[],templates:[],automations:[],contacts:[]},emails=[],triggers=[];let contactDown=false,eventTimeout=false,createTimeout=false;
globalThis.fetch=async(url,options={})=>{const u=new URL(url);assert.equal(u.origin,'https://api.resend.com');const method=options.method||'GET',parts=u.pathname.slice(1).split('/').map(decodeURIComponent),[kind,id,action]=parts,body=options.body?JSON.parse(options.body):{};
 if(kind==='domains')return Response.json({name:'example.test',status:'verified',open_tracking:false,click_tracking:false});
 if(kind==='emails'){emails.push(body);return Response.json({id:crypto.randomUUID()})}
 if(kind==='contacts'&&contactDown)throw Error('Provider unavailable');
 if(kind==='events'&&id==='send'){triggers.push(body);if(eventTimeout)throw Error('Response lost after acceptance');return Response.json({id:crypto.randomUUID(),event:body.event});}
 const list=resources[kind];assert(list,'Unexpected provider path: '+u.pathname);
 if(method==='GET'&&!id)return Response.json({data:list,has_more:false});
 if(method==='POST'&&!id){const item={id:crypto.randomUUID(),...body};list.push(item);if(kind==='automations'&&createTimeout){createTimeout=false;throw Error('Lost create response');}return Response.json({id:item.id});}
 const item=list.find(r=>r.id===id||r.alias===id||r.email===id);if(!item)return Response.json({error:'missing'},{status:404});
 if(method==='GET')return Response.json(item);
 if(action==='publish'){item.status='published';return Response.json({id:item.id})}
 if(action==='stop'){item.status='disabled';return Response.json({id:item.id,status:item.status})}
 if(method==='PATCH'){if(body.properties)item.properties={...item.properties,...body.properties};for(const [k,v] of Object.entries(body))if(k!=='properties')item[k]=v;return Response.json({id:item.id});}
 throw Error('Unexpected operation');
};
const sender={key:'re_test_credentials_123',domainId:crypto.randomUUID(),from:'launch@example.test',replyTo:'help@example.test',company:'Example Schoolday',address:'100 Example Street, Test City, CA 90000'};
async function signup(email,followup=true){who(false);const r=await call('lead',{email,audience:'family',adult:true,consent:true,followup,source:'parent_referral'});assert.equal(r.status,200);const sent=emails.findLast(m=>m.to[0]===email);const token=sent.text.match(/#confirm=([^\s]+)/)[1];const confirmed=await call('lead-confirm',{token});assert.equal(confirmed.status,200);return r.data;}
const saveSetting=(key,value)=>sql.prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));

test('pipeline preparation is owner-only, resumable, and sends nothing',async()=>{
 assert.equal((await call('pipeline')).status,403);assert.equal((await call('pipeline-prepare',{})).status,403);
 who();assert.equal((await call('pipeline-prepare',{})).status,409);assert.equal((await call('email-connect',sender)).status,200);
 createTimeout=true;assert.equal((await call('pipeline-prepare',{})).status,502);const result=await call('pipeline-prepare',{});assert.equal(result.status,200);assert.equal(result.data.config.enabled,false);assert.equal(resources.automations.length,2);assert.equal(resources.templates.length,6);assert.equal(triggers.length,0);assert.equal(emails.length,0);
 await call('pipeline-prepare',{});assert.equal(resources.automations.length,2,'Repeated setup must not duplicate automations');assert.equal(resources.templates.length,6);
 for(const template of resources.templates){assert.equal(template.status,'published');assert(template.html.includes('{{{RESEND_UNSUBSCRIBE_URL}}}'));assert(template.html.includes(sender.address));}
 for(const automation of resources.automations){assert.equal(automation.status,'disabled');assert.equal(automation.steps.filter(s=>s.type==='condition').length,3);assert.equal(automation.steps.filter(s=>s.type==='send_email').length,3);for(const s of automation.steps.filter(s=>s.type==='send_email'))assert.equal(automation.connections.find(c=>c.to===s.key).type,'condition_met');}
 assert.equal((await call('pipeline-switch',{enabled:true,reviewed:true})).status,409);await call('email-switch',{enabled:true,launchEnabled:false});assert.equal((await call('pipeline-switch',{enabled:true,reviewed:false})).status,400);assert.equal((await call('pipeline-switch',{enabled:true,reviewed:true})).status,200);
});
test('only explicit confirmed opt-ins start; duplicate confirmation does not restart',async()=>{
 await signup('legacy@example.test',false);assert.equal(triggers.length,0);
 who(false);await call('lead',{email:'unconfirmed@example.test',audience:'family',adult:true,consent:true,followup:true});assert.equal(triggers.length,0);
 await signup('parent@example.test');assert.equal(triggers.length,1);assert(triggers[0].event.endsWith('.prospect'));assert.deepEqual(Object.keys(triggers[0]).sort(),['contact_id','event']);assert.equal(resources.contacts.length,1);
 const token=emails.find(m=>m.to[0]==='parent@example.test').text.match(/#confirm=([^\s]+)/)[1];await call('lead-confirm',{token});assert.equal(triggers.length,1);const row=sql.prepare('SELECT * FROM pipeline_contacts').get();assert(!row.email_cipher.includes('parent@example.test'));
});
test('live subscription stops prospect path; sandbox cannot count or trigger onboarding',async()=>{
 const stamp=new Date().toISOString();sql.prepare("INSERT INTO accounts(id,email,name,kind,created_at) VALUES('family','parent@example.test','Family','family',?)").run(stamp);sql.prepare("INSERT INTO subscriptions(id,account_id,customer_id,plan,status,quantity,period_end,cancel_at_end,checked_at) VALUES('sub_fixture','family','cus_fixture','family','active',1,?,0,?)").run(Date.now()/1000+86400,Date.now());
 saveSetting('billing_config',{mode:'test'});await syncPipelineForAccount('family','test');assert.equal(triggers.length,1);who();assert.equal((await call('pipeline')).data.totals.subscribers,0);
 saveSetting('billing_config',{mode:'live'});await syncPipelineForAccount('family','live');assert.equal(triggers.length,2);assert(triggers[1].event.endsWith('.customer'));const c=resources.contacts[0];assert.equal(Object.values(c.properties)[0],'customer');assert.equal((await call('pipeline')).data.totals.subscribers,1);
 await syncPipelineForAccount('family','live');assert.equal(triggers.length,2);sql.prepare("UPDATE subscriptions SET status='canceled'").run();await syncPipelineForAccount('family','live');assert.equal(Object.values(c.properties)[0],'inactive');assert.equal(triggers.length,2);
});
test('uncertain event acceptance is held; contact failures can retry safely',async()=>{
 eventTimeout=true;await signup('uncertain@example.test');const count=triggers.length;eventTimeout=false;who();await call('pipeline-retry',{});assert.equal(triggers.length,count);const row=sql.prepare("SELECT * FROM pipeline_contacts WHERE prospect_status='uncertain'").get();assert(row.error.includes('uncertain'));
 contactDown=true;await signup('retry@example.test');contactDown=false;who();for(let i=0;i<2;i++)await call('pipeline-retry',{});assert.equal(triggers.length,count+1);assert.equal(resources.contacts.filter(c=>c.email==='retry@example.test').length,1);
});
test('removal suppresses delayed messages and provider unsubscribe is respected',async()=>{
 const lead=await signup('remove@example.test');const contact=resources.contacts.find(c=>c.email==='remove@example.test');who(false);assert.equal((await call('lead-remove',{token:lead.removalToken})).status,200);assert.equal(Object.values(contact.properties)[0],'suppressed');assert(!sql.prepare('SELECT * FROM launch_leads WHERE email=?').get('remove@example.test'));
 resources.contacts.push({id:crypto.randomUUID(),email:'unsubscribed@example.test',unsubscribed:true,properties:{}});const before=triggers.length;await signup('unsubscribed@example.test');assert.equal(triggers.length,before);assert.equal(resources.contacts.find(c=>c.email==='unsubscribed@example.test').unsubscribed,true);
 who();assert.equal((await call('pipeline-switch',{enabled:false,reviewed:true})).status,200);await signup('paused@example.test');assert.equal(triggers.length,before);
});
test('campaign links preserve grade and remove unsafe source characters',()=>{
 assert.equal(campaignHref('/join?grade=7','parent_referral'),'/join?grade=7&utm_source=parent_referral');assert.equal(campaignHref('/try?grade=6',null),'/try?grade=6');assert(!campaignHref('/join','x&email=private@example.com').includes('email='));
});
