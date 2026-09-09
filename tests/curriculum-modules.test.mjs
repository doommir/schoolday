import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
const b=await build({entryPoints:['lib/curriculum-modules.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {curriculumModule,moduleAttribution,deliveryPrompt}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
test('every supported subject and grade has a self-contained contract for all delivery modes',()=>{
 for(const grade of [6,7,8])for(const subject of ['Math','Science','Literacy','Humanities','Studio']){
  const m=curriculumModule(grade,subject);assert.equal(m.grade,grade);assert.equal(m.structure.length,6);
  assert.match(m.delivery.solo,/no partner required/);assert.match(m.delivery.squad_async,/without waiting/);
  assert.match(m.contract,/individual checks identical/);assert.ok(moduleAttribution(m).supports.length<=1000);
 }
 assert.throws(()=>curriculumModule(5,'Math'));assert.throws(()=>curriculumModule(6,'toString'));
});
test('source editions and age limits remain explicit instead of treating all free content as licensed',()=>{
 assert.match(curriculumModule(6,'Math').url,/im.kendallhunt.com\/MS/);
 assert.match(curriculumModule(7,'Science').limits,/no blanket permission/);
 assert.match(curriculumModule(8,'Literacy').name,/Louisiana ELA Guidebooks/);
 assert.match(curriculumModule(8,'Literacy').limits,/third-party books/);
 assert.match(curriculumModule(8,'Studio').routine,/evidence-based writing/);
 assert.match(curriculumModule(8,'Humanities').rights,/no commercial republication license assumed/);
 assert.match(deliveryPrompt(true,false),/keep going/);assert.match(deliveryPrompt(false,false),/no partner/);
});
