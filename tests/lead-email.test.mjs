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
const state=globalThis.__schooldayTest={env:{DB,APP_SECRET:'test-secret',TEACHER_EMAILS:'owner@example.test',STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_testonlysecret'},headers:new Headers(),cookies:{}};
await build({entryPoints:['app/api/[action]/route.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-email-test.mjs',alias:{'cloudflare:workers':path.join(process.cwd(),'tests/helpers/runtime.mjs'),'next/headers':path.join(process.cwd(),'tests/helpers/headers.mjs')}});
const {GET,POST}=await import('file:///tmp/schoolday-email-test.mjs');
async function call(action,body){const r=await(body===undefined?GET:POST)(new Request('https://schoolday.test/api/'+action,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://schoolday.test'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({action:action.split('?')[0]})});return {status:r.status,data:await r.json()};}
function who(id,email){state.headers=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{});}


const sends=[];let verified=true,down=false;
globalThis.fetch=async(url,options)=>{const u=new URL(url);assert.equal(u.origin,'https://api.resend.com');if(u.pathname.startsWith('/domains/'))return Response.json({name:'example.test',status:verified?'verified':'pending',open_tracking:false,click_tracking:false});const b=JSON.parse(options.body);sends.push({body:b,key:options.headers['Idempotency-Key']});if(down)throw Error('Simulated ambiguous timeout');return Response.json({id:crypto.randomUUID()});};
const config={key:'re_test_credentials_123',domainId:crypto.randomUUID(),from:'launch@example.test',replyTo:'help@example.test',company:'Example Schoolday',address:'100 Example Street, Test City, CA 90000'};
const signup={email:'adult@example.test',audience:'family',adult:true,consent:true};
test('email consent, authorization, idempotency, and launch gates',async()=>{
 assert.equal((await call('email-connect',config)).status,403);
 who('owner','owner@example.test');verified=false;assert.equal((await call('email-connect',config)).status,409);verified=true;assert.equal((await call('email-connect',config)).status,200);assert.notEqual(sql.prepare("SELECT value FROM settings WHERE id='email_key'").get().value,config.key);
 assert.equal((await call('email-switch',{enabled:true,launchEnabled:true})).status,409);
 assert.equal((await call('email-switch',{enabled:true,launchEnabled:false})).status,200);
 who(null);let first=await call('lead',signup);assert.equal(first.data.emailStatus,'accepted');assert.equal(sends.length,1);assert.equal((await call('lead',signup)).data.removalToken,undefined);assert.equal(sends.length,1);
 assert.equal((await call('lead-confirm',{token:first.data.removalToken})).status,410,'removal token must not confirm email');
 const token=sends[0].body.text.match(/#confirm=([^\s]+)/)[1];assert.notEqual(token,first.data.removalToken);assert.equal((await call('lead-confirm',{token})).status,200);assert.equal(sends.length,1,'closed checkout must never announce access');
 who('owner','owner@example.test');const status=await call('email-status');assert.equal(status.data.eligible,1);assert(!JSON.stringify(status.data).includes(config.key));sql.prepare("INSERT INTO settings(id,value) VALUES('sales_open','true')").run();await call('email-switch',{enabled:true,launchEnabled:true});await call('email-process',{});assert.equal(sends.length,2);assert(sends[1].body.text.includes('#remove='+first.data.removalToken));await call('email-process',{});assert.equal(sends.length,2,'campaign sent only once');
 who(null);await call('lead-remove',{token:first.data.removalToken});assert.equal(sql.prepare('SELECT count(*) n FROM lead_emails').get().n,0);assert.equal((await call('lead-confirm',{token})).status,410);
 down=true;const failed=await call('lead',{...signup,email:'other@example.test'});assert.equal(failed.data.emailStatus,'error');const sent=sends.at(-1);down=false;who('owner','owner@example.test');await call('email-process',{});assert.deepEqual(sends.at(-1),sent,'retry must retain identical payload and key');
 down=true;who(null);await call('lead',{...signup,email:'expired@example.test'});down=false;sql.prepare("UPDATE lead_emails SET first_attempt=? WHERE status='error'").run(Date.now()-24*3600000);const count=sends.length;who('owner','owner@example.test');await call('email-process',{});assert.equal(sends.length,count);assert.equal(sql.prepare("SELECT status FROM lead_emails WHERE kind='confirmation' ORDER BY rowid DESC LIMIT 1").get().status,'expired');
 await call('email-switch',{enabled:false,launchEnabled:false});who(null);await call('lead',{...signup,email:'paused@example.test'});assert.equal(sends.length,count);
});
