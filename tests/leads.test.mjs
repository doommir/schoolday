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
await build({entryPoints:['app/api/[action]/route.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-leads-test.mjs',alias:{'cloudflare:workers':path.join(process.cwd(),'tests/helpers/runtime.mjs'),'next/headers':path.join(process.cwd(),'tests/helpers/headers.mjs')}});
const {GET,POST}=await import('file:///tmp/schoolday-leads-test.mjs');
async function call(action,body){const r=await(body===undefined?GET:POST)(new Request('https://schoolday.test/api/'+action,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://schoolday.test'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({action:action.split('?')[0]})});return {status:r.status,data:await r.json()};}
function who(id,email){state.headers=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{});}

test('launch list captures consent without exposing customer addresses',async()=>{
 const body={email:'Adult@Example.test',audience:'family',adult:true,consent:true,source:'community'};
 assert.equal((await call('lead',{...body,consent:false})).status,400);
 assert.equal((await call('leads')).status,403);
 const first=await call('lead',body);assert.equal(first.status,200);assert(first.data.removalToken);
 assert.equal(sql.prepare('SELECT email FROM launch_leads').get().email,'adult@example.test');
 assert.equal((await call('lead',body)).data.removalToken,undefined);
 assert.equal(sql.prepare('SELECT count(*) n FROM launch_leads').get().n,1);
 assert.equal((await call('lead-delete',{id:sql.prepare('SELECT id FROM launch_leads').get().id})).status,403);
 who('owner','owner@example.test');const list=await call('leads');assert.equal(list.data.leads.length,1);assert.equal(list.data.leads[0].delete_hash,undefined);
 who(null);assert.equal((await call('lead-remove',{token:first.data.removalToken})).status,200);assert.equal(sql.prepare('SELECT count(*) n FROM launch_leads').get().n,0);
 await call('lead',{...body,website:'spam'});assert.equal(sql.prepare('SELECT count(*) n FROM launch_leads').get().n,0);
 await call('lead',body);sql.prepare("UPDATE launch_leads SET created_at='2020-01-01'").run();who('owner','owner@example.test');assert.equal((await call('leads')).data.leads.length,0);
 sql.prepare('UPDATE lead_limits SET calls=500').run();who(null);assert.equal((await call('lead',body)).status,429);
});
