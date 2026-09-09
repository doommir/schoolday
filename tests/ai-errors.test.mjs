import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
const result=await build({entryPoints:['lib/ai-errors.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {providerFailure,legacySearchEligible}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('provider failures give safe, distinct recovery instructions',()=>{
 assert.match(providerFailure(400,{error:{param:'tools[0]',message:'web_search not supported'}},'req_test',true).message,/web-search tool/);
 assert.match(providerFailure(400,{error:{code:'invalid_json_schema'}},null,false).message,/schema/);
 assert.match(providerFailure(429,{error:{code:'insufficient_quota'}},null,false).message,/billing, credits/);
 assert.match(providerFailure(429,{},null,false).message,/rate limiting/);
 assert.match(providerFailure(404,{},null,false).message,/model is unavailable/);
 assert.match(providerFailure(503,null,null,false).message,/temporarily unavailable/);
 const failure=providerFailure(401,{error:{message:'Secret sk-test-private and student input',code:'sk-test-private',param:'student input'}},'invalid secret',false);
 assert(!failure.message.includes('sk-test-private'));assert(!failure.message.includes('student input'));assert(!failure.message.includes('invalid secret'));
 assert.equal(failure.status,503);
});

test('legacy search retry is bounded to unsupported tools',()=>{
 for(const message of ['Tool web_search is not supported with this model','Invalid value: web_search'])assert(legacySearchEligible(400,{error:{message}}));
 for(const message of ['web_search permission not supported','web_search filters unsupported','web_search_preview unsupported','unrelated error'])assert(!legacySearchEligible(400,{error:{message}}));
 for(const status of [401,403,429,500])assert(!legacySearchEligible(status,{error:{message:'web_search unsupported'}}));
 assert(!legacySearchEligible(400,null));
});
