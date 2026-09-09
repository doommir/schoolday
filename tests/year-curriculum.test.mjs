import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
const code=await build({entryPoints:['lib/year-curriculum.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {auditYearEvidence,coreSubjects,courseUnits,mappedDay,yearStandards}=await import('data:text/javascript;base64,'+Buffer.from(code.outputFiles[0].text).toString('base64'));
for(const grade of [6,7,8]) test(`grade ${grade} schedules every applicable core target across exactly 180 days`,()=>{
  const all=Array.from({length:180},(_,i)=>mappedDay(grade,i+1));
  for(const day of all){assert.equal(day.items.length,5);assert.deepEqual(day.items.map(i=>i.subject),coreSubjects);assert.equal(day.items.reduce((n,i)=>n+i.minutes,0),200);}
  for(const subject of coreSubjects){
    const units=courseUnits(grade,subject);assert.equal(units[0].start,1);assert.equal(units.at(-1).end,180);
    for(let i=1;i<units.length;i++)assert.equal(units[i].start,units[i-1].end+1);
    const planned=all.flatMap(d=>d.items.filter(i=>i.subject===subject));
    for(const target of yearStandards(grade,subject)) assert(planned.some(i=>i.standardId===target.id),`${subject} ${target.id} was omitted`);
    for(const item of planned){assert(yearStandards(grade,subject).some(s=>s.id===item.standardId));assert(!/^RL\.[678]\.8$/.test(item.standardId));assert(item.context.week>=1&&item.context.week<=36);}
    for(const u of units)assert.equal(planned[u.end-1].context.stage,'Unit check and reflection');
  }
  assert.throws(()=>mappedDay(grade,181));assert.throws(()=>mappedDay(grade,0));
});
test('review responds to weak evidence without displacing first instruction or changing course scope',()=>{
  const units=courseUnits(6,'Math'),u=units.find(u=>u.standards.length>1),target=u.standards.at(-1).id;
  const history=[{subject:'Math',standard_id:'8.F.1',correct:0},{subject:'Math',standard_id:target,correct:0}];
  const last=mappedDay(6,u.end,history).items.find(i=>i.subject==='Math');assert.equal(last.standardId,target);
  assert.equal(mappedDay(6,u.start,history).items.find(i=>i.subject==='Math').standardId,mappedDay(6,u.start).items.find(i=>i.subject==='Math').standardId);
});
test('year completion requires all 900 distinct mapped slots with complete evidence',()=>{
 const rows=Array.from({length:180},(_,i)=>mappedDay(6,i+1).items.map(item=>({year_day:i+1,subject:item.subject,standard_id:item.standardId,status:'complete',responses:8,checks:2}))).flat();
 assert.equal(auditYearEvidence(6,rows).complete,true);
 assert.equal(auditYearEvidence(6,rows.slice(1)).complete,false);
 assert.equal(auditYearEvidence(6,[...rows.slice(1),rows[1]]).complete,false);
 const wrong=structuredClone(rows);wrong[0].standard_id='RI.8.1';assert.equal(auditYearEvidence(6,wrong).complete,false);
 const held=structuredClone(rows);held[0].status='held';assert.equal(auditYearEvidence(6,held).complete,false);
 const incomplete=structuredClone(rows);incomplete[0].checks=1;assert.equal(auditYearEvidence(6,incomplete).complete,false);
 assert.equal(auditYearEvidence(6,[...rows,{...rows[0],year_day:181}]).complete,false);
});
