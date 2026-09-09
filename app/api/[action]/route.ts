import {serviceStatus,runServiceMaintenance} from '@/lib/service-operations';
import {billingNoticeInbox,billingNoticeStatus,sendBillingNotices} from '@/lib/billing-notices';
import {privacyHome,requestConsent,consentQueue,verifyConsent,revokeConsent,exportLearner,deleteLearner,requireConsent} from '@/lib/privacy-controls';
import {preparationAccess} from '@/lib/learning-access';
import {adultYear,advanceYear,canDeferDay,deferDay,ensureYear,latestYear,mappedDay,nextYearActivity,publicYearProgress,replaceOwnHeldLesson,saveYearReview} from '@/lib/school-year';
import {pipelineStatus,preparePipeline,switchPipeline,retryPipeline} from '@/lib/pipeline';
import {setupLiveStripe} from '@/lib/stripe-setup';
import {familyEntry,onboardFamily} from '@/lib/family-entry';
import {validationDetails,validateProvider,inspectLaunchLesson,approveLaunchReview} from '@/lib/launch-validation';
import {familyHome,saveFamilySetup,saveFamilyJournal,familyExport} from '@/lib/family';
import {familyOffer} from '@/lib/family-guide';
import {assertReleased} from '@/lib/release';
import {assignedStandard,standardsFor,curriculumVersion} from '@/lib/standards';
import {connectEmail,confirmLead,emailStatus,emailSwitch,processEmail} from '@/lib/lead-email';
import {captureLead,removeLead,listLeads,deleteLead} from '@/lib/leads';
import {lockAdult,setAdultPin,unlockAdult} from '@/lib/adult-lock';
import {createDeviceCode,redeemDeviceCode} from '@/lib/devices';
import {launchStatus,reserveLearnerUsage,saveLaunch,saveWebhookSecret} from '@/lib/launch';
import {paymentWebhook} from '@/lib/payment-webhook';
import {adultProgress,answerHelp,generationSupport,helpInbox,historyDay,learnerHelp,preferences,progress,requestHelp,resolveHelp,savePreferences} from '@/lib/continuity';
import {account,ownLearner,attachCreatedLearner,learnerRoster,learnerWork,linkLearner,selectLearner,setupAccount} from '@/lib/accounts';
import {catalog,accountOverview,billingPortal,checkout,connectBilling,reconcileCheckout,requireLearningLicense} from '@/lib/billing';
import {saveSchool,saveSchoolRecord,schoolAdmin,schoolExport,schoolStudent,schoolWork} from '@/lib/school';
import {evidenceFor,getResume,markComplete,modeSchema,nextStage,saveDraft,saveState,stateFor} from '@/lib/learning';
import {createRoom,isAsync,joinRoom,listRooms,postReply,roomView,squadAction,squadMembership} from '@/lib/squads';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {activityFor,db,educator,hash,HttpError,jsonInput,now,profile,putSetting,requireEducator,route,runtime,sameOrigin,seal,setting,uid} from '@/lib/server';
import {connection,planDay,runGeneration} from '@/lib/ai';
import {studentLesson} from '@/lib/quality';
import type {Lesson} from '@/lib/types';
export const dynamic='force-dynamic';
type Context={params:Promise<{action:string}>};
async function getDay(pid:string){return db().prepare('SELECT * FROM days WHERE profile_id=? ORDER BY day_number DESC LIMIT 1').bind(pid).first();}
async function serializeActivity(a:Record<string,unknown>){if(a.payload&&['ready','complete'].includes(String(a.status))){try{await assertReleased(a)}catch{a={...a,status:'held',phase:'held',payload:null,error:'This lesson needs an integrity review. Saved work is preserved.'};}}const {source_pack,lock_token,standard_snapshot,generation_signature,payload,reviews,...rest}=a;return {...rest,payload:['ready','complete'].includes(String(a.status))&&payload?JSON.stringify(studentLesson(JSON.parse(String(payload)))):null};}
async function event(pid:string,kind:string,detail:unknown){await db().prepare('INSERT INTO events VALUES(?,?,?,?,?)').bind(uid(),pid,kind,JSON.stringify(detail),now()).run();}
export async function GET(req:Request,ctx:Context){return route(async()=>{const {action}=await ctx.params;
 if(action==='status'){let p=null;try{p=await profile();}catch(e){if(!(e instanceof HttpError&&[401,403].includes(e.status)))throw e;}return {profile:p,learning:p?await stateFor(p.id):null,educator:await educator(),connected:!!(runtime().OPENAI_API_KEY||await setting('ai_key')),model:await setting('ai_model')||'gpt-4.1-mini'};}
 if(action==='service-status')return serviceStatus();
 if(action==='billing-notices')return billingNoticeInbox();
 if(action==='billing-notice-status')return billingNoticeStatus();
 if(action==='privacy-home')return privacyHome();
 if(action==='consent-queue')return consentQueue();
 if(action==='privacy-export')return exportLearner(new URL(req.url).searchParams.get('id')||'');
 if(action==='launch-validation')return validationDetails();
 if(action==='launch-lesson')return inspectLaunchLesson(new URL(req.url).searchParams.get('id')||'');
 if(action==='family-entry')return familyEntry();
 if(action==='family-offer'){const c=await catalog();const p=(c.prices as Record<string,any>).family;return {available:c.mode==='live'&&c.salesOpen&&p?.amount===familyOffer.amount&&p?.interval==='month'&&p?.intervalCount===1};}
 if(action==='family'||action==='family-export'){const u=new URL(req.url);return action==='family'?familyHome(u.searchParams.get('profile')||'',u.searchParams.get('year')||undefined):familyExport(u.searchParams.get('profile')||'',u.searchParams.get('year')||'');}
 if(action==='email-status')return emailStatus();
 if(action==='pipeline')return pipelineStatus();
 if(action==='leads')return listLeads();
 if(action==='launch')return launchStatus();
 if(action==='account')return accountOverview();
 if(action==='learner-activity'||action==='learner-history-day'){const u=new URL(req.url),pid=u.searchParams.get('profile')||'',id=u.searchParams.get('id')||'';await ownLearner(pid);return action==='learner-activity'?getResume(pid,id):historyDay(pid,id);}
 if(action==='learner-year'||action==='year-export'){const u=new URL(req.url);return adultYear(u.searchParams.get('profile')||'',u.searchParams.get('year')||undefined);}
 if(action==='learner-progress')return adultProgress(new URL(req.url).searchParams.get('id')||'');
 if(action==='help-inbox')return helpInbox();
 if(action==='roster')return {learners:await learnerRoster()};
 if(action==='learner-work')return learnerWork(new URL(req.url).searchParams.get('id')||'');
 if(action==='school')return schoolAdmin(new URL(req.url).searchParams.get('profile')||undefined);
 if(action==='school-export')return schoolExport(new URL(req.url).searchParams.get('profile')||'');
 if(action==='school-work'){const url=new URL(req.url);return schoolWork(url.searchParams.get('profile')||'',url.searchParams.get('id')||'');}
 if(action==='review-lesson'){await requireEducator();const id=new URL(req.url).searchParams.get('id')||'';const a=await db().prepare('SELECT id,title,subject,standard_id,standard_snapshot,payload,status FROM activities WHERE id=?').bind(id).first();if(!a)throw new HttpError('Lesson not found.',404);return {activity:a};}
 if(action==='standards'){await requireEducator();const u=new URL(req.url);return {version:curriculumVersion,standards:standardsFor(Number(u.searchParams.get('grade')),u.searchParams.get('subject')||undefined)};}
 if(action==='educator'){await requireEducator();const held=await db().prepare("SELECT a.id,a.title,a.subject,a.phase,a.revision,a.reviews,a.error,a.standard_id,coalesce(y.grade,p.grade) AS grade FROM activities a JOIN days d ON d.id=a.day_id JOIN profiles p ON p.id=d.profile_id LEFT JOIN learning_years y ON y.id=d.learning_year_id WHERE a.superseded_by IS NULL AND (a.status IN ('held','error') OR (a.phase!='routine' AND a.standard_id IS NULL AND a.status='queued')) ORDER BY a.rowid DESC LIMIT 50").all();const totals=await db().prepare("SELECT status,count(*) AS count FROM activities GROUP BY status").all();return {held:held.results,totals:totals.results};}
 const p=await profile();
 if(action==='year-next')return nextYearActivity(p.id,new URL(req.url).searchParams.get('exclude')||undefined,new URL(req.url).searchParams.get('preparedOnly')==='1');
 if(action==='year')return publicYearProgress(p.id,new URL(req.url).searchParams.get('year')||undefined);
 if(action==='progress')return progress(p.id);
 if(action==='history-day')return historyDay(p.id,new URL(req.url).searchParams.get('id')||'');
 if(action==='preferences')return {preferences:await preferences(p.id)};
 if(action==='help')return learnerHelp(p.id);
 if(action==='school-student')return schoolStudent(p.id);
 if(action==='day'){const access=await preparationAccess(p.id);const day=await getDay(p.id),year=await latestYear(p.id);if(!day||year&&Number(year.start_day)>Number(day.day_number))return {...access,day:null,activities:[],evidence:[]};const activities=await db().prepare('SELECT * FROM activities WHERE day_id=? AND superseded_by IS NULL ORDER BY position').bind(day.id).all();const work=await db().prepare('SELECT e.* FROM evidence e JOIN activities a ON e.activity_id=a.id WHERE e.profile_id=? AND a.day_id=?').bind(p.id,day.id).all();return {...access,day,activities:await Promise.all(activities.results.map(serializeActivity)),evidence:work.results};}
 if(action==='portfolio'){const work=await db().prepare('SELECT e.*,a.title,a.subject,a.goal FROM evidence e JOIN activities a ON e.activity_id=a.id WHERE e.profile_id=? ORDER BY e.updated_at DESC LIMIT 300').bind(p.id).all();return {evidence:work.results};}
 if(action==='resume'){const url=new URL(req.url);const id=url.searchParams.get('id');return id?getResume(p.id,id,url.searchParams.get('room')||undefined):{state:await stateFor(p.id)};}
 if(action==='rooms')return {rooms:await listRooms(p.id)};
 if(action==='room'){const url=new URL(req.url);return roomView(url.searchParams.get('code')||'',p.id,url.searchParams.has('stage')?Number(url.searchParams.get('stage')):undefined);}

 throw new HttpError('Not found.',404);
 });}
export async function POST(req:Request,ctx:Context){return route(async()=>{const {action}=await ctx.params;if(action==='payment-webhook')return paymentWebhook(req);sameOrigin(req);const body=await jsonInput(req);
 if(action==='service-run')return runServiceMaintenance();
 if(action==='consent-request')return requestConsent(body);
 if(action==='consent-verify')return verifyConsent(body);
 if(action==='consent-revoke')return revokeConsent();
 if(action==='privacy-delete')return deleteLearner(body);
 if(action==='validate-ai')return validateProvider();
 if(action==='launch-review')return approveLaunchReview(body);
 if(action==='year-review')return saveYearReview(body);
 if(action==='advance-year')return advanceYear(body);
 if(action==='family-onboard')return onboardFamily(body);
 if(action==='family-setup')return saveFamilySetup(body);
 if(action==='family-journal')return saveFamilyJournal(body);
 if(action==='pipeline-prepare')return preparePipeline();
 if(action==='pipeline-switch')return switchPipeline(body);
 if(action==='pipeline-retry')return retryPipeline();
 if(action==='email-connect')return connectEmail(body);
 if(action==='email-switch')return emailSwitch(body);
 if(action==='email-process')return processEmail();
 if(action==='lead-confirm')return confirmLead(body);
 if(action==='lead')return captureLead(body,req);
 if(action==='lead-remove')return removeLead(body);
 if(action==='lead-delete')return deleteLead(body);
 if(action==='adult-unlock')return unlockAdult(body);
 if(action==='adult-lock')return lockAdult();
 if(action==='adult-pin')return {recovery:await setAdultPin(z.object({pin:z.string().regex(/^\d{6}$/)}).parse(body).pin)};
 if(action==='device-code')return createDeviceCode(body);
 if(action==='redeem-device')return redeemDeviceCode(body);
 if(action==='launch')return saveLaunch(body);
 if(action==='webhook-secret')return saveWebhookSecret(body);
 if(action==='help-answer')return answerHelp(body);
 if(action==='account-setup')return setupAccount(body);
 if(action==='link-learner')return linkLearner();
 if(action==='select-learner')return selectLearner(body);
 if(action==='stripe-setup')return setupLiveStripe(body,new URL(req.url).origin);
 if(action==='billing-connect')return connectBilling(body,new URL(req.url).origin);
 if(action==='checkout')return checkout(body,new URL(req.url).origin);
 if(action==='billing-refresh')return reconcileCheckout(z.object({sessionId:z.string().regex(/^cs_[a-zA-Z0-9_]+$/).optional()}).parse(body).sessionId);
 if(action==='billing-portal')return billingPortal(new URL(req.url).origin);
 if(action==='school-config')return saveSchool(body);
 if(action==='school-record')return saveSchoolRecord(body);
 if(action==='connection'){await requireEducator();const b=z.object({key:z.string().min(20).max(500),model:z.string().regex(/^[a-zA-Z0-9._-]+$/).max(100)}).parse(body);const encrypted=await seal(b.key);const check=await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(b.model)}`,{headers:{Authorization:`Bearer ${b.key}`},signal:AbortSignal.timeout(15000)});if(!check.ok)throw new HttpError('That key or model could not be verified. Check your API account and try again.');await putSetting('ai_key',encrypted);await putSetting('ai_model',b.model);await putSetting('ai_probe','null');await putSetting('sales_open','false');return {connected:true};}
 if(action==='profile'){const b=z.object({name:z.string().trim().min(1).max(50),grade:z.number().int().min(6).max(8)}).parse(body);const owner=await account();await requireConsent(String(owner!.id));if(owner){const count=await db().prepare('SELECT count(*) AS n FROM account_learners WHERE account_id=?').bind(owner.id).first();if(Number(count?.n)>=500)throw new HttpError('This workspace has reached its learner limit.');}const token=uid()+uid();const id=uid();await db().prepare('INSERT INTO profiles(id,session,name,grade,created_at) VALUES(?,?,?,?,?)').bind(id,await hash(token),b.name,b.grade,now()).run();(await cookies()).set('schoolday_session',token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:60*60*24*365});await attachCreatedLearner(id);return {profile:{id,...b}};}
 if(action==='replace-lesson'){await requireEducator();const b=z.object({id:z.string().uuid(),standardId:z.string().max(80)}).strict().parse(body);const a=await db().prepare('SELECT a.*,p.id AS profile_id,coalesce(y.grade,p.grade) AS grade FROM activities a JOIN days d ON d.id=a.day_id JOIN profiles p ON p.id=d.profile_id LEFT JOIN learning_years y ON y.id=d.learning_year_id WHERE a.id=?').bind(b.id).first();if(!a)throw new HttpError('Lesson not found.',404);assignedStandard(b.standardId,Number(a.grade),String(a.subject));if(a.course_context&&b.standardId!==a.standard_id)throw new HttpError('A mapped year replacement must keep this assigned standard. Use another lesson for a different target.',409);if(a.superseded_by||!['held','error','queued'].includes(String(a.status)))throw new HttpError('Only an unresolved lesson can be replaced.',409);const id=uid();const result=await db().batch([db().prepare("INSERT INTO activities(id,day_id,subject,title,goal,prerequisite,minutes,position,standard_id,lesson_key,course_context,status,phase) SELECT ?,day_id,subject,title,goal,prerequisite,minutes,position,?,lesson_key,course_context,'queued','research' FROM activities WHERE id=? AND superseded_by IS NULL AND status IN ('held','error','queued')").bind(id,b.standardId,b.id),db().prepare('UPDATE activities SET superseded_by=?,lock_token=NULL,locked_until=0 WHERE id=? AND superseded_by IS NULL AND EXISTS(SELECT 1 FROM activities WHERE id=?)').bind(id,b.id,id),db().prepare("UPDATE days SET status='ready' WHERE id=? AND EXISTS(SELECT 1 FROM activities WHERE id=?)").bind(a.day_id,id)]);if(!result[0].meta.changes)throw new HttpError('Another replacement was already created. Refresh the queue.',409);await event(String(a.profile_id),'lesson_replaced',{previous:b.id,replacement:id,standardId:b.standardId});return {id};}
 if(action==='retry-held'){await requireEducator();const b=z.object({id:z.string().uuid(),standardId:z.string().max(80).optional()}).parse(body);const a=await db().prepare('SELECT a.*,coalesce(y.grade,p.grade) AS grade FROM activities a JOIN days d ON d.id=a.day_id JOIN profiles p ON p.id=d.profile_id LEFT JOIN learning_years y ON y.id=d.learning_year_id WHERE a.id=?').bind(b.id).first();if(!a)throw new HttpError('Lesson not found.',404);const target=assignedStandard(b.standardId||String(a.standard_id||''),Number(a.grade),String(a.subject));if(a.course_context&&target.id!==a.standard_id)throw new HttpError('Keep the mapped year target when retrying this lesson.',409);const saved=await db().prepare('SELECT id FROM evidence WHERE activity_id=? UNION ALL SELECT id FROM drafts WHERE activity_id=? LIMIT 1').bind(b.id,b.id).first();if(saved)throw new HttpError('This lesson has saved learner work. Preserve it while arranging a replacement activity; it cannot be overwritten.',409);await db().prepare("UPDATE activities SET standard_id=?,status='queued',phase='research',revision=0,generation_signature=NULL,reviews='[]',source_pack=NULL,payload=NULL,content_hash=NULL,standard_snapshot=NULL,generation_attempts=0,next_retry_at=0,error=NULL,locked_until=0,lock_token=NULL WHERE id=? AND superseded_by IS NULL AND status IN ('held','error','queued') AND NOT EXISTS(SELECT 1 FROM evidence WHERE activity_id=activities.id) AND NOT EXISTS(SELECT 1 FROM drafts WHERE activity_id=activities.id)").bind(target.id,b.id).run();return {ok:true};}
 const p=await profile();
 if(action==='preferences')return savePreferences(p.id,body);
 if(action==='help-request')return requestHelp(p.id,body);
 if(action==='help-resolve')return resolveHelp(p.id,body);
 if(['plan','generate','create-room','join-room','repair-lesson'].includes(action))await requireLearningLicense(p.id);
 if(['plan','generate'].includes(action)&&(p.grade<6||p.grade>8))throw new HttpError('This version creates lessons for grades 6–8. Earlier saved work remains available.',409);
 if(action==='repair-lesson')return replaceOwnHeldLesson(p.id,body);
 if(action==='plan'){
 if(!(await connection()).key)throw new HttpError('An educator needs to connect AI before your day can be created.',503);
 let day=await getDay(p.id);const activeYear=await latestYear(p.id),newYearPending=activeYear&&day&&Number(activeYear.start_day)>Number(day.day_number);
 if(day&&day.status==='ready'){if(body.next&&day.learning_year_id&&await canDeferDay(String(day.id))){await deferDay(String(day.id));day={...day,status:'needs_review'};}else return {id:day.id};}
 if(day&&['complete','needs_review'].includes(String(day.status))&&!body.next&&!newYearPending)return {id:day.id};
 if(!day||['complete','needs_review'].includes(String(day.status))){
 const id=uid(),n=day?Number(day.day_number)+1:1,year=await ensureYear(p.id,p.grade,n),yearDay=n-Number(year.start_day)+1;
 if(yearDay>Number(year.total_days))throw new HttpError('The 180-day path is planned. Finish any unresolved work and open My year for the adult review.',409);
 if(n>1&&day!.created_at&&String(day!.created_at).slice(0,10)===now().slice(0,10)){const count=await db().prepare('SELECT count(*) AS n FROM days WHERE profile_id=? AND created_at>=?').bind(p.id,now().slice(0,10)).first();if(Number(count?.n)>=3)throw new HttpError('You have created three school days today. Continue your saved practice and return tomorrow.',429);}
 await db().prepare("INSERT OR IGNORE INTO days(id,profile_id,day_number,learning_year_id,year_day,theme,question,status,created_at) VALUES(?,?,?,?,?,'Preparing your day','', 'planning',?)").bind(id,p.id,n,year.id,yearDay,now()).run();day=await getDay(p.id);
 }
 const dayToken=uid();const acquired=await db().prepare("UPDATE days SET locked_until=?,lock_token=?,status='planning',error=NULL WHERE id=? AND locked_until<? AND status IN ('planning','error')").bind(Date.now()+120000,dayToken,day!.id,Date.now()).run();if(!acquired.meta.changes)throw new HttpError('Your day is already being prepared. Wait a moment, then refresh.',409);
 try{const history=await db().prepare('SELECT a.subject,a.standard_id,a.goal,a.prerequisite,e.stage,e.correct FROM evidence e JOIN activities a ON e.activity_id=a.id WHERE e.profile_id=? AND e.stage>=6 ORDER BY e.updated_at DESC LIMIT 50').bind(p.id).all();const assignment=day!.learning_year_id?mappedDay(p.grade,Number(day!.year_day),history.results):null;const plan=assignment||await planDay(p.grade,history.results,await generationSupport(p.id));const inserts=plan.items.map((item,i)=>{const context='context'in item?item.context:null;return db().prepare("INSERT INTO activities(id,day_id,subject,title,goal,prerequisite,minutes,position,standard_id,lesson_key,course_context,status,phase) SELECT ?,?,?,?,?,?,?,?,?,?,?,'queued','research' WHERE EXISTS(SELECT 1 FROM days WHERE id=? AND lock_token=? AND status='planning')").bind(uid(),day!.id,item.subject,item.title,item.goal,item.prerequisite,item.minutes,i*2+1,item.standardId,context?String(day!.learning_year_id)+':'+day!.year_day+':'+item.subject:null,context?JSON.stringify(context):null,day!.id,dayToken);});const routines=[{position:0,subject:'Arrival',title:'Arrive & set an intention',goal:'Name one thing you want to understand today.',minutes:10},{position:4,subject:'Movement',title:'Move, breathe, reset',goal:'Step away from the screen. Choose gentle movement that feels comfortable: walk, stretch seated or standing, or rest your eyes. Take water if you need it. Return when ready.',minutes:20},{position:6,subject:'Lunch',title:'Lunch & a screen break',goal:'Take time to eat, rest, and connect with someone nearby. Your work will be here when you return.',minutes:40},{position:10,subject:'Reflection',title:'Look how far you came',goal:'Name one idea you can explain now, one piece of evidence you created, and one question for tomorrow.',minutes:15}];for(const r of routines)inserts.push(db().prepare("INSERT INTO activities(id,day_id,subject,title,goal,prerequisite,minutes,position,status,phase) SELECT ?,?,?,?,?,'',?,?,'ready','routine' WHERE EXISTS(SELECT 1 FROM days WHERE id=? AND lock_token=? AND status='planning')").bind(uid(),day!.id,r.subject,r.title,r.goal,r.minutes,r.position,day!.id,dayToken));inserts.push(db().prepare("UPDATE days SET theme=?,question=?,status='ready',locked_until=0,lock_token=NULL WHERE id=? AND lock_token=? AND status='planning'").bind(plan.theme,plan.question,day!.id,dayToken));const committed=await db().batch(inserts);if(!committed[committed.length-1].meta.changes)throw new HttpError('A newer day plan replaced this request. Refresh your day.',409);return {id:day!.id};}catch(e){await db().prepare("UPDATE days SET status='error',locked_until=0,lock_token=NULL,error=? WHERE id=? AND lock_token=?").bind(e instanceof HttpError?e.message:'The day planner could not finish. Please retry.',day!.id,dayToken).run();throw e;}
 }
 if(action==='generate'){
 const b=z.object({id:z.string().uuid()}).parse(body);const a=await activityFor(b.id,p.id);if(a.superseded_by)throw new HttpError('A replacement lesson is available in your day.',409);if(['ready','complete'].includes(String(a.status))){if(a.payload)await assertReleased(a);return {status:a.status,phase:a.phase};}if(a.status==='held')throw new HttpError('This lesson needs an educator’s review before it can be used.',409);if(Number(a.next_retry_at)>Date.now())throw new HttpError('Preparation is cooling down after a failed request. Please retry in a minute.',429);assignedStandard(String(a.standard_id||''),Number(a.lesson_grade),String(a.subject));
 const token=uid();const r=await db().prepare("UPDATE activities SET locked_until=?,lock_token=?,status='generating',error=NULL WHERE id=? AND locked_until<? AND status IN ('queued','error','generating')").bind(Date.now()+120000,token,b.id,Date.now()).run();if(!r.meta.changes)throw new HttpError('This lesson is already being prepared. Refresh in a moment.',409);
 try{await reserveLearnerUsage(p.id);return await runGeneration({...a,lock_token:token},Number(a.lesson_grade),await generationSupport(p.id));}catch(e){const counted=e instanceof HttpError&&e.status===429?0:1;await db().prepare("UPDATE activities SET status=CASE WHEN generation_attempts+?>=4 THEN 'held' ELSE 'error' END,phase=CASE WHEN generation_attempts+?>=4 THEN 'held' ELSE phase END,generation_attempts=generation_attempts+?,next_retry_at=?,locked_until=0,lock_token=NULL,error=? WHERE id=? AND lock_token=? AND status='generating'").bind(counted,counted,counted,Date.now()+60000,e instanceof HttpError?e.message:'The generation step could not finish. Wait a minute, then retry.',b.id,token).run();throw e;}
 }
 if(action==='answer'){
 const b=z.object({id:z.string().uuid(),stage:z.number().int().min(0).max(7),response:z.string().max(15000).default(''),choice:z.number().int().min(0).max(4).nullable().default(null),selfCheck:z.array(z.string().max(600)).max(5).default([]),room:z.string().max(8).optional()}).parse(body);
 let a:Record<string,unknown>;let savedActivityId=b.id;let chosenText='';let membership:Record<string,unknown>|null=null;
 if(b.room){const m=await squadMembership(b.room,p.id);membership=m;if(m.activity_id!==b.id||m.pacing==='solo'||(!isAsync(m)&&(Number(m.stage)!==b.stage||m.state!=='active')))throw new HttpError('Your Squad pacing changed. Reopen the shared lesson to continue.',409);savedActivityId=String(m.assigned_activity_id||b.id);a=(await db().prepare('SELECT * FROM activities WHERE id=?').bind(b.id).first())!;const own=await activityFor(savedActivityId,p.id);if(!['ready','complete'].includes(String(own.status)))throw new HttpError('Your assigned lesson is held for review.',409);}else a=await activityFor(b.id,p.id);
 if(!['ready','complete'].includes(String(a.status)))throw new HttpError('Wait until the lesson is ready.',409);
 if(a.superseded_by)throw new HttpError('A replacement lesson is available. This earlier work is preserved for review.',409);if(a.payload)await assertReleased(a);
 if(!a.payload&&b.stage!==0)throw new HttpError('Routine activities have one response step.');
 let correct:number|null=null,feedback='',canAdvance=true;
 if(a.payload){const l=JSON.parse(String(a.payload)) as Lesson;const stage=b.stage<6?l.stages[b.stage]:l.checks[b.stage-6];if(!stage)throw new HttpError('Invalid lesson step.');if(stage.options.length){if(b.choice===null||b.choice>=stage.options.length)throw new HttpError('Choose one response first.');chosenText=stage.options[b.choice].text;correct=b.choice===stage.answer?1:0;feedback=stage.options[b.choice].feedback;canAdvance=b.stage===3?correct===1:true;}else if(b.response.trim().length<(p.grade<=2?1:10))throw new HttpError(p.grade<=2?'Tell a grown-up your idea, then ask them to add a few words.':'Add a little more detail about your thinking.');
 if(b.stage>0){const previous=await db().prepare('SELECT stage,correct FROM evidence WHERE profile_id=? AND activity_id=? AND stage<? ORDER BY stage').bind(p.id,savedActivityId,b.stage).all();if(previous.results.length!==b.stage||previous.results.some((r:any,i:number)=>Number(r.stage)!==i)||(b.stage>3&&previous.results.find((r:any)=>r.stage===3)?.correct!==1))throw new HttpError('Complete the earlier learning steps first.',409);}
 }else if(!['Lunch','Movement'].includes(String(a.subject))&&b.response.trim().length<3)throw new HttpError('Add a short response before continuing.');
 const prior=await db().prepare('SELECT * FROM evidence WHERE profile_id=? AND activity_id=? AND stage=?').bind(p.id,savedActivityId,b.stage).first();
 if(b.stage>=6&&prior){correct=prior.correct as number;feedback='Your first independent response is saved. Use the lesson model to revisit the idea.';}
 else{const conflict=b.stage>=6?'DO NOTHING':'DO UPDATE SET response=excluded.response,choice=excluded.choice,correct=excluded.correct,self_check=excluded.self_check,updated_at=excluded.updated_at';await db().prepare('INSERT INTO evidence(id,profile_id,activity_id,stage,response,choice,correct,self_check,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(profile_id,activity_id,stage) '+conflict).bind(prior?.id||uid(),p.id,savedActivityId,b.stage,b.response,b.choice,correct,JSON.stringify(b.selfCheck),now()).run();if(b.stage>=6){const saved=await db().prepare('SELECT correct,choice FROM evidence WHERE profile_id=? AND activity_id=? AND stage=?').bind(p.id,savedActivityId,b.stage).first();correct=saved!.correct as number;if(saved!.choice!==b.choice)feedback='Your first independent response is saved. Use the lesson model to revisit the idea.';}await event(p.id,'response',{activity:b.id,stage:b.stage,correct});}
 if(b.room&&canAdvance)await db().prepare('INSERT INTO room_responses(id,room_code,profile_id,stage,response,choice) VALUES(?,?,?,?,?,?) ON CONFLICT(room_code,profile_id,stage) '+(b.stage>=6?'DO NOTHING':'DO UPDATE SET response=excluded.response,choice=excluded.choice')).bind(uid(),b.room,p.id,b.stage,b.response||chosenText,b.choice).run();
 if((b.stage===7||!a.payload)&&(!membership||isAsync(membership)))await markComplete(p.id,savedActivityId);
 const oldState=await stateFor(p.id);const learningMode=membership?(isAsync(membership)?'squad_async':'squad_live'):(oldState?.mode==='solo_async'?'solo_async':'solo');
 await saveState(p.id,learningMode,savedActivityId,Math.min(canAdvance?b.stage+1:b.stage,7),b.room||null);
 return {correct,feedback,canAdvance};
 }
 if(action==='create-room')return createRoom(p,body);
 if(action==='join-room')return joinRoom(p,body);
 if(action==='room-action')return squadAction(p,body);
 if(action==='reply')return postReply(p.id,body);
 if(action==='draft')return saveDraft(p.id,body);
 if(action==='learning-mode'){
  const b=z.object({mode:modeSchema,id:z.string().uuid().optional(),room:z.string().length(6).optional(),paused:z.boolean().default(false)}).parse(body);
  const prior=await stateFor(p.id);const code=b.room||prior?.room_code;
  if(b.mode.startsWith('squad')){if(!code)throw new HttpError('Join or start a Squad first.');return squadAction(p,{code,command:'set-pacing',pacing:b.mode==='squad_async'?'async':'follow'});}
  if(code)await squadAction(p,{code,command:'set-pacing',pacing:'solo'});
  const aid=b.id||prior?.activity_id||null;if(aid)await activityFor(String(aid),p.id);const cursor=aid?nextStage(await evidenceFor(p.id,String(aid))):0;
  await saveState(p.id,b.mode,aid?String(aid):null,Math.min(cursor,7),null,b.paused);return {ok:true};
 }
 if(action==='report'){const b=z.object({id:z.string().uuid(),reason:z.string().trim().min(5).max(2000)}).parse(body);await activityFor(b.id,p.id);await event(p.id,'content_flag',b);await db().prepare("UPDATE activities SET status='held',phase='held',lock_token=NULL,locked_until=0,error=? WHERE id=? OR (content_hash IS NOT NULL AND content_hash=(SELECT content_hash FROM activities WHERE id=?))").bind('Learner reported: '+b.reason,b.id,b.id).run();return {ok:true};}
 throw new HttpError('Not found.',404);
 });}
