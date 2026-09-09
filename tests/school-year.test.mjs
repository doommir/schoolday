import {installPrivacySchema} from './helpers/privacy-schema.mjs';
import {installConsentFixtures} from './helpers/consent-fixtures.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const sql=new DatabaseSync(':memory:');
for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+f,'utf8'));
installPrivacySchema(sql);
installConsentFixtures(sql);
class Prepared{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Prepared(this.query,args)}async first(){return sql.prepare(this.query).get(...this.args)||null}async all(){return {results:sql.prepare(this.query).all(...this.args)}}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}}}}
const DB={prepare:q=>new Prepared(q),async batch(stmts){sql.exec('BEGIN');try{const rows=[];for(const stmt of stmts)rows.push(await stmt.run());sql.exec('COMMIT');return rows}catch(e){sql.exec('ROLLBACK');throw e}}};
const state=globalThis.__schooldayTest={env:{DB,APP_SECRET:'school-year-fixture-only',OPENAI_API_KEY:'fixture-only',TEACHER_EMAILS:'teacher@example.test'},headers:new Headers(),cookies:{}};
sql.prepare("INSERT INTO settings VALUES('pilot_emails',?)").run(JSON.stringify(['parent@example.test']));
await build({entryPoints:['app/api/[action]/route.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-full-year-test.mjs',alias:{'cloudflare:workers':path.join(process.cwd(),'tests/helpers/runtime.mjs'),'next/headers':path.join(process.cwd(),'tests/helpers/headers.mjs')}});
const {GET,POST}=await import('file:///tmp/schoolday-full-year-test.mjs');
async function call(action,body){const response=await (body===undefined?GET:POST)(new Request('https://schoolday.test/api/'+action,{method:body===undefined?'GET':'POST',headers:{Origin:'https://schoolday.test','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({action:action.split('?')[0]})});return {status:response.status,data:await response.json()};}
function who(id='parent',email='parent@example.test'){state.headers=new Headers(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{});}
globalThis.fetch=async()=>{throw Error('Planning and year records must not call an AI provider.');};
async function newLearner(grade){who();await call('account-setup',{name:'Fixture family',kind:'family',adult:true});const r=await call('profile',{name:'Fixture learner',grade});assert.equal(r.status,200);return r.data.profile;}
// This simulates completed learning evidence to exercise year progression. It does not
// stand in for executing or validating 540 AI-authored instructional days.
function completeFixtureDay(id){
  const blocks=sql.prepare('SELECT * FROM activities WHERE day_id=? AND superseded_by IS NULL').all(id);
  for(const a of blocks){for(let stage=0;stage<(a.phase==='routine'?1:8);stage++)sql.prepare('INSERT INTO evidence(id,profile_id,activity_id,stage,response,choice,correct,self_check,updated_at) SELECT ?,profile_id,?,?,?,?,?,?,? FROM days WHERE id=? ON CONFLICT DO NOTHING').run(crypto.randomUUID(),a.id,stage,'Synthetic year-progression evidence.',stage>=6?0:null,stage===3||stage>=6?1:null,'[]',new Date().toISOString(),id);}
  sql.prepare("UPDATE activities SET status='complete' WHERE day_id=? AND superseded_by IS NULL").run(id);
  sql.prepare("UPDATE days SET status='complete',created_at='2020-01-01T00:00:00Z' WHERE id=?").run(id);
}

test('year endpoints reject anonymous access and other families',async()=>{
  who(null);assert.equal((await call('year')).status,401);assert.equal((await call('advance-year',{})).status,400);
  const learner=await newLearner(6);await call('plan',{});const own=await call('year');assert(own.data.year.id);assert.equal(own.data.completedDays,0);assert.equal(own.data.signature,undefined);
  who('stranger','stranger@example.test');await call('account-setup',{name:'Other family',kind:'family',adult:true});assert.equal((await call('learner-year?profile='+learner.id)).status,404);assert.equal((await call('year-export?profile='+learner.id)).status,404);
  who();
});

for(const grade of [6,7,8]) test(`grade ${grade} completes 180 distinct days and stops before day 181`,async()=>{
  const learner=await newLearner(grade);let first,last;
  for(let day=1;day<=180;day++){
    const r=await call('plan',{next:day>1});assert.equal(r.status,200,JSON.stringify(r));
    const d=sql.prepare('SELECT * FROM days WHERE id=?').get(r.data.id);assert.equal(d.year_day,day);first ||= d;last=d;
    const again=await call('plan',{next:true});assert.equal(again.data.id,d.id);
    const blocks=sql.prepare('SELECT * FROM activities WHERE day_id=? AND superseded_by IS NULL').all(d.id);assert.equal(blocks.length,9);
    for(const block of blocks.filter(a=>a.phase!=='routine')){const context=JSON.parse(block.course_context);assert.equal(context.day,day);assert.equal(context.standardId,block.standard_id);}
    completeFixtureDay(d.id);
  }
  const report=(await call('year')).data;assert.equal(report.completedDays,180);assert.equal(report.coreComplete,true);assert.equal(report.reviewCurrent,false);assert.equal(report.days.length,180);assert.equal(report.pending.length,0);assert(report.coverage.every(s=>s.withEvidence===s.total));
  assert.equal((await call('plan',{next:true})).status,409);assert.equal(sql.prepare('SELECT count(*) n FROM days WHERE profile_id=?').get(learner.id).n,180);
  assert.equal((await call('history-day?id='+first.id)).status,200);
  const premature=await call('advance-year',{profile:learner.id,year:report.year.id,adultConfirmed:true});assert.equal(premature.status,409);
  const review={profile:learner.id,year:report.year.id,adultConfirmed:true,notes:'Synthetic adult review for the year progression integration test.',outside:report.outside.map(s=>({id:s.id,resource:'Fixture course of study and resource record',evidence:'Synthetic record of instruction and reviewed work across this course.',completed:true}))};
  const missing=await call('year-review',{...review,outside:review.outside.slice(1)});assert.equal(missing.status,400);
  const saved=await call('year-review',review);assert.equal(saved.status,200,JSON.stringify(saved));assert.equal(saved.data.reviewCurrent,true);
  assert.equal((await call('year-export?profile='+learner.id+'&year='+report.year.id)).data.days.length,180);
  if(grade<8){const next=await call('advance-year',{profile:learner.id,year:report.year.id,adultConfirmed:true});assert.equal(next.status,200,JSON.stringify(next));assert.equal(next.data.grade,grade+1);assert.equal(next.data.completedDays,0);assert.equal((await call('day')).data.day,null);assert.equal((await call('advance-year',{profile:learner.id,year:report.year.id,adultConfirmed:true})).data.year.id,next.data.year.id);const start=await call('plan',{});assert.equal(start.status,200);assert.equal(sql.prepare('SELECT year_day FROM days WHERE id=?').get(start.data.id).year_day,1);assert.equal((await call('year?year='+report.year.id)).data.completedDays,180);}
  else assert.equal((await call('advance-year',{profile:learner.id,year:report.year.id,adultConfirmed:true})).status,409);
  // A late report invalidates the prior completion/review without deleting evidence.
  const old=sql.prepare("SELECT id FROM activities WHERE day_id=? AND subject='Math'").get(first.id);assert.equal((await call('report',{id:old.id,reason:'Synthetic report of an error in a saved lesson.'})).status,200);
  const invalid=(await call('year?year='+report.year.id)).data;assert.equal(invalid.coreComplete,false);assert.equal(invalid.reviewCurrent,false);assert(invalid.pending.some(a=>a.id===old.id));
  if(grade===6){
    const repaired=await call('repair-lesson',{id:old.id});assert.equal(repaired.status,200);
    const originalFetch=globalThis.fetch;let brief;
    globalThis.fetch=async(url,opts)=>{
      if(String(url).startsWith('https://www2.cde.ca.gov/'))return new Response('<h4>6.NS.1</h4><div style="white-space: pre-wrap; ">Interpret and compute quotients of fractions, and solve contextual problems with fractions.</div>');
      assert.equal(url,'https://api.openai.com/v1/responses');brief=JSON.parse(JSON.parse(opts.body).input);
      return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Use fraction models and equal-sized units to explain division.',annotations:[{type:'url_citation',url:'https://www.thecorestandards.org/Math/Content/6/NS/',title:'Fractions'}]}]}]});
    };
    try{const generated=await call('generate',{id:repaired.data.id});assert.equal(generated.status,200,JSON.stringify(generated));assert.equal(brief.grade,6);assert.equal(brief.courseSequence.day,1);assert.equal(brief.officialStandard.id,'6.NS.1');}
    finally{globalThis.fetch=originalFetch;}
    assert.equal(sql.prepare('SELECT grade FROM profiles WHERE id=?').get(learner.id).grade,7);
  }

});

test('held work carries forward, replacements preserve evidence and cannot change the target',async()=>{
  const learner=await newLearner(6);const first=(await call('plan',{})).data.id;
  completeFixtureDay(first);sql.prepare("UPDATE days SET status='ready' WHERE id=?").run(first);
  const held=sql.prepare("SELECT * FROM activities WHERE day_id=? AND subject='Math'").get(first);sql.prepare("UPDATE activities SET status='held',phase='held' WHERE id=?").run(held.id);
  const before=sql.prepare('SELECT count(*) n FROM evidence WHERE activity_id=?').get(held.id).n;
  const next=await call('plan',{next:true});assert.equal(next.status,200);assert.notEqual(next.data.id,first);assert.equal(sql.prepare('SELECT status FROM days WHERE id=?').get(first).status,'needs_review');
  let replacement=await call('repair-lesson',{id:held.id});assert.equal(replacement.status,200,JSON.stringify(replacement));assert.equal((await call('repair-lesson',{id:held.id})).data.id,replacement.data.id);
  let a=sql.prepare('SELECT * FROM activities WHERE id=?').get(replacement.data.id);assert.equal(a.standard_id,held.standard_id);assert.equal(a.course_context,held.course_context);assert.equal(a.payload,null);assert.equal(sql.prepare('SELECT count(*) n FROM evidence WHERE activity_id=?').get(held.id).n,before);
  sql.prepare("UPDATE activities SET status='held' WHERE id=?").run(a.id);replacement=await call('repair-lesson',{id:a.id});assert.equal(replacement.status,200);a=sql.prepare('SELECT * FROM activities WHERE id=?').get(replacement.data.id);sql.prepare("UPDATE activities SET status='held' WHERE id=?").run(a.id);assert.equal((await call('repair-lesson',{id:a.id})).status,409);
  assert.equal(sql.prepare('SELECT count(*) n FROM activities WHERE day_id=? AND superseded_by IS NULL').get(first).n,9);
  assert.equal((await call('year')).data.completedDays,0);
});
