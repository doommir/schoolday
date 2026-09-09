import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {build} from 'esbuild';
let calls=[],queue=[],reserved=0;
const DB={prepare(){return {bind(){return this},async first(){return null},async run(){reserved++;return {meta:{changes:1}}}}}};
globalThis.__schooldayTest={env:{DB,OPENAI_API_KEY:'test-only',OPENAI_MODEL:'gpt-4.1-mini'},headers:new Headers(),cookies:{}};
await build({entryPoints:['lib/ai.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/schoolday-search-compatibility.mjs',alias:{'cloudflare:workers':path.resolve('tests/helpers/runtime.mjs'),'next/headers':path.resolve('tests/helpers/headers.mjs')}});
const {aiCall}=await import('file:///tmp/schoolday-search-compatibility.mjs');
globalThis.fetch=async(url,opts)=>{calls.push(JSON.parse(opts.body));assert(queue.length,'unexpected extra request');return queue.shift()};
const unsupported=()=>Response.json({error:{message:'Tool web_search is not supported with this model',param:'tools'}},{status:400});
const success=(url='https://www.nasa.gov/science/',searched=true)=>Response.json({status:'completed',output:[...(searched?[{type:'web_search_call',status:'completed'}]:[]),{type:'message',content:[{type:'output_text',text:'A grounded brief.',annotations:[{type:'url_citation',url}]}]}]});
test('search compatibility preserves grounding and stops after one retry',async()=>{
 calls=[];queue=[unsupported(),success()];reserved=0;
 assert.equal((await aiCall('Research','No personal information',undefined,true)).urls.length,1);
 assert.equal(calls.length,2);assert.equal(reserved,4);
 assert(calls[0].tools[0].filters.allowed_domains.includes('nasa.gov'));
 assert.deepEqual(calls[0].tool_choice,{type:'web_search'});
 assert.deepEqual(calls[1].tools,[{type:'web_search_preview'}]);
 assert.deepEqual(calls[1].tool_choice,{type:'web_search_preview'});
 calls=[];queue=[unsupported(),unsupported()];await assert.rejects(aiCall('Research','Topic',undefined,true));assert.equal(calls.length,2);
 for(const response of [success('https://unapproved.example/'),success('https://www.nasa.gov/',false)]){
  calls=[];queue=[unsupported(),response];await assert.rejects(aiCall('Research','Topic',undefined,true));assert.equal(calls.length,2);
 }
 for(const status of [401,403,429,500]){
  calls=[];queue=[Response.json({error:{message:'web_search unsupported'}},{status})];await assert.rejects(aiCall('Research','Topic',undefined,true));assert.equal(calls.length,1);
 }
});
