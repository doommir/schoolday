import assert from "node:assert/strict";
import test from "node:test";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,nextResolve){if(specifier==="cloudflare:workers")return {url:"data:text/javascript,export const env={}",shortCircuit:true};return nextResolve(specifier,context);}});

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});


test("sample lesson is rendered without learner identity or provider access", async () => {
  const {default:worker}=await import(new URL("../dist/server/index.js",import.meta.url).href);
  const response=await worker.fetch(new Request("http://localhost/try",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const html=await response.text();
  assert(html.includes("One useful unit"));
  assert(html.includes("FREE LESSON PREVIEW"));
});

test('public introduction and search routes work without authentication',async()=>{
 const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url).href);
 for(const [route,expected] of [['/start','Your adult email'],['/family-guide','Your setup checklist'],['/join','Your family'],['/robots.txt','Sitemap:'],['/sitemap.xml','<urlset']]){
 const r=await worker.fetch(new Request('http://localhost'+route,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(r.status,200,route);assert((await r.text()).includes(expected),route);
 }
});

test('math guide keeps hints, answers, grade campaigns and sitemap reachable without identity',async()=>{
 const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url).href);
 async function read(path){const response=await worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200,path);return response.text();}
 const path='/resources/middle-school-math-check-at-home',html=await read(path);
 assert.match(html,/When your learner gets stuck/);
 assert.match(html,/https:\/\/ies.ed.gov\/ncee\/wwc\/PracticeGuide\/16/);
 assert.match(html,/<time dateTime="2026-10-06"|<time datetime="2026-10-06"/);
 const clean=html.replace(/<!--.*?-->/gs,'');
 assert.match(clean,/\$29 versus \$32/);
 assert.doesNotMatch(clean,/\$49 versus \$32/);
 assert.match(clean,/Why isn’t the lower hourly rate always cheaper\?/);
 const worked=clean.match(/<details><summary>Show the worked answer · grade 8<\/summary>(.*?)<\/details>/s)?.[1];
 assert(worked,'comparison stays inside the collapsed worked answer');
 assert.match(worked,/<caption>Compare the same number of hours in both rental plans<\/caption>/);
 const rows=[...worked.matchAll(/<tr><th scope="row">(\d+)<\/th><td>\$(\d+)<\/td><td>\$(\d+)<\/td><\/tr>/g)];
 assert.deepEqual(rows.map(r=>r.slice(1).map(Number)),[[0,5,0],[2,11,8],[4,17,16],[5,20,20],[8,29,32]]);
 for(const [,hours,withFee,noFee] of rows){assert.equal(Number(withFee),3*Number(hours)+5);assert.equal(Number(noFee),4*Number(hours));}
 assert.equal((html.match(/<details>/g)||[]).length,6);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
 for(const grade of [6,7,8]){
  assert(html.includes('id="grade-'+grade+'"'));
  assert(html.includes('/try?grade='+grade+'&amp;utm_source=guide_middle_school_math_check_at_home'));
  assert(html.replace(/<!--.*?-->/gs,'').includes('Show the worked answer · grade '+grade));
 }
 for(const slug of ['middle-school-homeschool-schedule','middle-school-curriculum-checklist']){
  assert(html.includes('/resources/'+slug));await read('/resources/'+slug);
 }
 assert((await read('/resources')).includes(path));
 assert((await read('/sitemap.xml')).includes('https://schoolday-os.sickyicky.chatgpt.site'+path));
 const other=await read('/resources/solo-and-asynchronous-homeschool');
 assert(other.includes('Choose Solo when flexibility matters most'));
 assert.doesNotMatch(other,/<details>/);
});

test('schedule guide separates app time from daily movement and keeps grade sample paths',async()=>{
 const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url).href);
 async function read(path){const response=await worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200,path);return response.text();}
 const path='/resources/middle-school-homeschool-schedule',html=await read(path);
 assert.match(html,/How long should a middle-school homeschool day be\?/);
 assert.match(html,/A short Schoolday movement block is only one possible part of that daily total/);
 assert.match(html,/https:\/\/www.cdc.gov\/physical-activity\/php\/guidelines-recommendations\/index.html/);
 assert.match(html,/https:\/\/www.cdc.gov\/sleep\/about\/index.html/);
 assert.match(html,/<time dateTime="2026-09-22"|<time datetime="2026-09-22"/);
 assert(html.includes('/resources/solo-and-asynchronous-homeschool'));
 for(const grade of [6,7,8])assert(html.includes('/try?grade='+grade+'&amp;utm_source=guide_middle_school_homeschool_schedule'));
 assert((await read('/resources')).includes(path));
 assert((await read('/sitemap.xml')).includes('https://schoolday-os.sickyicky.chatgpt.site'+path));
});

test('curriculum checklist tests alignment claims and keeps legal setup separate',async()=>{
 const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url).href);
 async function read(path){const response=await worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200,path);return response.text();}
 const path='/resources/middle-school-curriculum-checklist',html=await read(path);
 assert.match(html,/What does “standards-aligned” actually mean\?/);
 assert.match(html,/https:\/\/www2.cde.ca.gov\/cacs\/ela/);
 assert.match(html,/https:\/\/www.cde.ca.gov\/sp\/ps\/homeschool.asp/);
 assert.match(html,/A strong lesson does not establish a complete year/);
 assert.match(html,/curriculum-quality audit, not a legal-compliance checklist/);
 assert.match(html,/<time dateTime="2026-09-29"|<time datetime="2026-09-29"/);
 for(const slug of ['middle-school-math-check-at-home','middle-school-homeschool-schedule'])assert(html.includes('/resources/'+slug));
 for(const grade of [6,7,8])assert(html.includes('/try?grade='+grade+'&amp;utm_source=guide_middle_school_curriculum_checklist'));
 assert((await read('/resources')).includes(path));
 assert((await read('/sitemap.xml')).includes('https://schoolday-os.sickyicky.chatgpt.site'+path));
});
