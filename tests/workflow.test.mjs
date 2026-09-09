import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
const bundled = await build({stdin:{contents:"export * from './lib/workflow'; export * from './lib/preview-progress';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'node',write:false});
const {entryHref,entryContext,learningContinuation,nextLearningActivity,readPreview,resumeOrPlanDay} = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

test('grade and campaign survive preview, adult sign-in and verified checkout return',()=>{
  for(const grade of ['6','7','8']) {
    const start=entryContext('?grade='+grade+'&utm_source=parent_group');
    const preview=entryContext(new URL(entryHref('preview',start.grade,start.source),'https://schoolday.test').search);
    const returnTo=entryHref('family',preview.grade,preview.source,'cs_test_return');
    const signin=new URL('/signin-with-chatgpt?return_to='+encodeURIComponent(returnTo),'https://schoolday.test');
    const returned=new URL(signin.searchParams.get('return_to'),'https://schoolday.test');
    assert.deepEqual(entryContext(returned.search),{step:'family',grade,source:'parent_group'});
    assert.equal(returned.searchParams.get('session_id'),'cs_test_return');
  }
  assert.deepEqual(entryContext('?flow=https://evil.test&grade=2&utm_source=%3Cscript%3E','family'),{step:'family',grade:'6',source:'script'});
  assert.equal(new URL(entryHref('family','8','group','cs_test_a&next=https://evil.test'),'https://schoolday.test').origin,'https://schoolday.test');
});

test('Continue restores a saved Squad and chooses the next available activity after completion',()=>{
  const blocks=[{id:'arrival',status:'complete'},{id:'held',status:'held'},{id:'old',status:'superseded'},{id:'math',status:'ready'},{id:'science',status:'queued'}];
  const saved={activity_id:'science',mode:'squad_async',room_code:'ABC234'};
  assert.deepEqual(learningContinuation(blocks,saved),{activity:blocks[4],roomCode:'ABC234'});
  assert.equal(learningContinuation(blocks,{...saved,mode:'solo_async'}).roomCode,null);
  assert.deepEqual(learningContinuation(blocks,{activity_id:'held',mode:'squad_live',room_code:'OLD234'}),{activity:blocks[3],roomCode:null});
  assert.equal(nextLearningActivity(blocks,null,'math').id,'science');
  assert.deepEqual(learningContinuation(blocks,saved,'science'),{activity:blocks[3],roomCode:null});
  assert.equal(nextLearningActivity(blocks.slice(0,3)),undefined);
  assert.equal(blocks[1].status,'held'); // Skipping cannot turn held work into completed evidence.
});

test('sample progress resumes only the matching grade and malformed tab storage is harmless',()=>{
  const snapshot={grade:'7',step:6,response:'Saved thinking',choice:0,checked:true,first:0};
  assert.deepEqual(readPreview(JSON.stringify(snapshot),'7'),snapshot);
  assert.equal(readPreview(JSON.stringify(snapshot),'8'),null);
  for(const raw of [null,'bad JSON','{}',JSON.stringify({...snapshot,step:8}),JSON.stringify({...snapshot,choice:null}),JSON.stringify({...snapshot,response:'x'.repeat(15001)})]) assert.equal(readPreview(raw,'7'),null);
  assert.deepEqual(readPreview(JSON.stringify({...snapshot,step:7,response:'',choice:null,checked:false}),'7'),{...snapshot,step:7,response:'',choice:null,checked:false});
});


test('returning families open saved work without planning or an active generation license',async()=>{
  const calls=[];
  const saved=async(path)=>{calls.push(path);if(path!=='day')throw Error('An outage must not turn a saved-day read into generation.');return {day:{id:'saved-day'}};};
  await resumeOrPlanDay(saved,true);await resumeOrPlanDay(saved,false);assert.deepEqual(calls,['day','day']);
  const empty=[];await resumeOrPlanDay(async path=>{empty.push(path);return {day:null};},false);assert.deepEqual(empty,['day']);
  const first=[];await resumeOrPlanDay(async path=>{first.push(path);return {day:null};},true);assert.deepEqual(first,['day','plan']);
  const blocks=[{id:'unprepared',status:'queued'},{id:'prepared',status:'ready'},{id:'held',status:'held'}];
  assert.equal(learningContinuation(blocks,{activity_id:'unprepared'},undefined,true).activity.id,'prepared');
  assert.equal(learningContinuation(blocks,{activity_id:'unprepared'},undefined,false).activity.id,'unprepared');
  assert.equal(learningContinuation([blocks[0],blocks[2]],null,undefined,true).activity,undefined);
});
