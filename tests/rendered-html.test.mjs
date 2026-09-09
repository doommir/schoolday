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
