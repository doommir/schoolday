import {familyResources} from './family-resources';
import {business} from './business';
import {db,setting,now} from './server';
// Public protocol verification token, deliberately served at the site root.
export const indexNowKey='91697b7b29834f9688e954ca34bfe839';
export const publicSearchPaths=['/start','/try','/family-guide','/resources',...familyResources.map(r=>'/resources/'+r.slug)];
const revision='parent-math-check-2026-09-09-1';
type State={revision:string;attempts:number;nextAt:number;status:string;checkedAt?:string;httpStatus?:number};
export async function searchDiscoveryStatus(){return JSON.parse(await setting('search_discovery')||'null') as State|null;}
export async function notifySearchEngines(){
 const previous=await searchDiscoveryStatus();
 if(previous?.revision===revision&&(previous.status==='submitted'||previous.attempts>=6||previous.nextAt>Date.now()))return;
 const lease=String(Date.now()+60000),key='search_discovery_lock';
 const lock=await db().prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value WHERE CAST(settings.value AS INTEGER)<?').bind(key,lease,Date.now()).run();
 if(!lock.meta.changes)return;
 try{
  const current=await searchDiscoveryStatus();
  if(current?.revision===revision&&(current.status==='submitted'||current.attempts>=6||current.nextAt>Date.now()))return;
  const attempts=(current?.revision===revision?current.attempts:0)+1;
  const state:State={revision,attempts,nextAt:Date.now()+Math.min(86400000,3600000*2**(attempts-1)),status:'retry pending',checkedAt:now()};
  try{const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:new URL(business.origin).host,key:indexNowKey,keyLocation:business.origin+'/'+indexNowKey+'.txt',urlList:publicSearchPaths.map(p=>business.origin+p)}),signal:AbortSignal.timeout(12000)});state.httpStatus=r.status;state.status=r.status===200?'submitted':r.status===202?'verification pending':'retry pending';}catch{/* Retry during later activity; no private URLs or learner data are sent. */}
  await db().prepare("INSERT INTO settings(id,value) VALUES('search_discovery',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(JSON.stringify(state)).run();
 }finally{await db().prepare('DELETE FROM settings WHERE id=? AND value=?').bind(key,lease).run();}
}
