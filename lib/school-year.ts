import {z} from 'zod';
import {ownLearner,account} from './accounts';
import {db,hash,HttpError,now,uid,activityFor} from './server';
import {auditYearEvidence,coreSubjects,courseUnits,mappedDay,yearLength,yearStandards,yearVersion} from './year-curriculum';
import {familySubjects} from './family-guide';

export async function latestYear(pid:string){return db().prepare('SELECT * FROM learning_years WHERE profile_id=? ORDER BY start_day DESC LIMIT 1').bind(pid).first();}
export async function ensureYear(pid:string,grade:number,start:number){
  let year=await latestYear(pid);
  if(!year){await db().prepare('INSERT INTO learning_years(id,profile_id,grade,curriculum_version,start_day,total_days,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,start_day) DO NOTHING').bind(uid(),pid,grade,yearVersion,start,yearLength,now()).run();year=await latestYear(pid);}
  if(!year||year.grade!==grade)throw new HttpError('Your adult needs to review this learner’s grade before the next year starts.',409);
  if(year.curriculum_version!==yearVersion)throw new HttpError('This saved year needs an operator-supported curriculum update. Its work remains saved.',409);
  return year;
}
export async function canDeferDay(dayId:string){
  const counts=await db().prepare("SELECT count(*) total,sum(status='held') held,sum(status NOT IN ('complete','held')) unfinished FROM activities WHERE day_id=? AND superseded_by IS NULL").bind(dayId).first();
  return Number(counts?.total)>0&&Number(counts?.held)>0&&Number(counts?.unfinished)===0;
}
export async function deferDay(dayId:string){
  const result=await db().prepare("UPDATE days SET status='needs_review' WHERE id=? AND learning_year_id IS NOT NULL AND status='ready' AND EXISTS(SELECT 1 FROM activities WHERE day_id=days.id AND superseded_by IS NULL AND status='held') AND NOT EXISTS(SELECT 1 FROM activities WHERE day_id=days.id AND superseded_by IS NULL AND status NOT IN ('complete','held'))").bind(dayId).run();
  if(!result.meta.changes)throw new HttpError('Finish the available activities before continuing to the next day.',409);
}
export async function yearProgress(pid:string,yearId?:string){
  const learner=await db().prepare('SELECT id,name,grade FROM profiles WHERE id=?').bind(pid).first();
  if(!learner)throw new HttpError('Learner not found.',404);
  const year=yearId?await db().prepare('SELECT * FROM learning_years WHERE id=? AND profile_id=?').bind(yearId,pid).first():await latestYear(pid);
  if(yearId&&!year)throw new HttpError('This year does not belong to this learner.',404);
  const grade=Number(year?.grade||learner.grade);
  const units=coreSubjects.flatMap(subject=>courseUnits(grade,subject).map(u=>({id:u.id,subject,title:u.title,start:u.start,end:u.end,targets:u.standards.map(s=>({id:s.id,url:s.url}))})));
  const outside=familySubjects(grade).filter(s=>!['english','math','science','social'].includes(s.id));
  const years=(await db().prepare('SELECT id,grade,start_day,created_at FROM learning_years WHERE profile_id=? ORDER BY start_day DESC').bind(pid).all()).results;
  if(!year)return {learner,year:null,years,grade,totalDays:yearLength,completedDays:0,coreComplete:false,reviewCurrent:false,days:[],coverage:[],pending:[],units,outside,notice:'Your mapped year starts with your next new learning day. Earlier pilot work stays saved.'};
  const days=(await db().prepare("SELECT d.id,d.day_number,d.year_day,d.theme,d.status,count(a.id) blocks,coalesce(sum(a.status='complete'),0) completed,coalesce(sum(a.status='held'),0) held FROM days d LEFT JOIN activities a ON a.day_id=d.id AND a.superseded_by IS NULL WHERE d.learning_year_id=? AND d.profile_id=? GROUP BY d.id ORDER BY d.year_day").bind(year.id,pid).all()).results;
  const entries=(await db().prepare("SELECT a.id,a.subject,a.standard_id,a.status,a.content_hash,a.course_context,d.year_day,count(e.id) responses,coalesce(sum(e.stage>=6),0) checks,coalesce(sum(e.stage>=6 AND e.correct=1),0) correct,max(e.updated_at) updated_at FROM activities a JOIN days d ON d.id=a.day_id LEFT JOIN evidence e ON e.activity_id=a.id AND e.profile_id=d.profile_id WHERE d.learning_year_id=? AND d.profile_id=? AND a.superseded_by IS NULL AND a.phase!='routine' GROUP BY a.id ORDER BY d.year_day,a.position").bind(year.id,pid).all()).results;
  const coverage=coreSubjects.map(subject=>{
    const targets=yearStandards(grade,subject).map(s=>{const lessons=entries.filter(a=>a.subject===subject&&a.standard_id===s.id),finished=lessons.filter(a=>a.status==='complete'&&Number(a.responses)===8&&Number(a.checks)===2);return {id:s.id,url:s.url,assigned:lessons.length,completed:finished.length,checks:finished.reduce((n,a)=>n+Number(a.checks),0),correct:finished.reduce((n,a)=>n+Number(a.correct),0)};});
    return {subject,total:targets.length,withEvidence:targets.filter(t=>t.completed>0).length,targets};
  });
  const completedDays=days.filter(d=>d.status==='complete'&&Number(d.blocks)===9&&Number(d.completed)===9).length;
  const pending=(await db().prepare("SELECT a.id,a.title,a.subject,a.standard_id,a.status,d.year_day,d.day_number FROM activities a JOIN days d ON d.id=a.day_id WHERE d.learning_year_id=? AND d.profile_id=? AND a.superseded_by IS NULL AND a.status!='complete' ORDER BY d.year_day,a.position").bind(year.id,pid).all()).results;
  const coverageAudit=auditYearEvidence(grade,entries as Parameters<typeof auditYearEvidence>[1]);
  const coreComplete=completedDays===yearLength&&pending.length===0&&coverage.every(s=>s.total===s.withEvidence)&&coverageAudit.complete;
  const signature=await hash(JSON.stringify({year:year.id,completedDays,entries:entries.map(a=>[a.id,a.content_hash,a.status,a.responses,a.checks,a.correct,a.updated_at])}));
  const review=year.review?JSON.parse(String(year.review)):null;
  return {learner,year:{id:year.id,grade,version:year.curriculum_version,createdAt:year.created_at,review,reviewedAt:year.reviewed_at},years,grade,totalDays:yearLength,completedDays,coreComplete,reviewCurrent:coreComplete&&!!review&&year.review_signature===signature,days,coverage,coverageAudit,pending,units,outside,signature,notice:'180 learning days is this app’s course design. Completion records do not certify mastery, attendance, promotion, or school compliance.'};
}
export async function publicYearProgress(pid:string,yearId?:string){const {signature,...safe}=await yearProgress(pid,yearId);return safe;}
export async function nextYearActivity(pid:string,exclude?:string,preparedOnly=false){
  const year=await latestYear(pid);if(!year)return {activity:null};
  const activity=await db().prepare("SELECT a.id,a.status FROM activities a JOIN days d ON d.id=a.day_id WHERE d.learning_year_id=? AND d.profile_id=? AND a.superseded_by IS NULL AND a.status!='complete' AND a.id!=? AND (?=0 OR a.status='ready') ORDER BY CASE a.status WHEN 'held' THEN 1 ELSE 0 END,d.year_day,a.position LIMIT 1").bind(year.id,pid,exclude||'',preparedOnly?1:0).first();
  return {activity};
}
export async function adultYear(pid:string,yearId?:string){await ownLearner(pid);return publicYearProgress(pid,yearId);}
export async function saveYearReview(body:unknown){
  const b=z.object({profile:z.string().uuid(),year:z.string().uuid(),adultConfirmed:z.literal(true),notes:z.string().trim().min(20).max(4000),outside:z.array(z.object({id:z.string(),resource:z.string().trim().min(5).max(1200),evidence:z.string().trim().min(20).max(3000),completed:z.literal(true)}).strict()).max(6)}).strict().parse(body);
  await ownLearner(b.profile);const a=await account(),p=await yearProgress(b.profile,b.year);
  if(!p.coreComplete)throw new HttpError('Complete the mapped days and unresolved learning targets before closing the year review.',409);
  const expected=p.outside.map(s=>s.id);if(b.outside.length!==expected.length||new Set(b.outside.map(s=>s.id)).size!==expected.length||b.outside.some(s=>!expected.includes(s.id)))throw new HttpError('Include the instruction and evidence for every outside area of study.',400);
  await db().prepare('UPDATE learning_years SET review=?,review_signature=?,reviewed_by=?,reviewed_at=? WHERE id=? AND profile_id=?').bind(JSON.stringify({notes:b.notes,outside:b.outside,adultConfirmed:true}),p.signature,a!.id,now(),b.year,b.profile).run();
  return publicYearProgress(b.profile,b.year);
}
export async function advanceYear(body:unknown){
  const b=z.object({profile:z.string().uuid(),year:z.string().uuid(),adultConfirmed:z.literal(true)}).strict().parse(body);
  await ownLearner(b.profile);const report=await yearProgress(b.profile,b.year),current=await latestYear(b.profile);
  if(current?.id!==b.year){if(current&&Number(current.grade)===report.grade+1)return publicYearProgress(b.profile,String(current.id));throw new HttpError('Reopen the learner’s current year.',409);}
  if(!report.reviewCurrent)throw new HttpError('Finish and review the current year before starting the next grade.',409);
  if(report.grade>=8)throw new HttpError('Grades 6–8 are finished. Arrange the next course of study with your learner’s adult.',409);
  const nextStart=Number(current!.start_day)+yearLength;
  await db().batch([db().prepare('INSERT INTO learning_years(id,profile_id,grade,curriculum_version,start_day,total_days,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,start_day) DO NOTHING').bind(uid(),b.profile,report.grade+1,yearVersion,nextStart,yearLength,now()),db().prepare('UPDATE profiles SET grade=? WHERE id=? AND grade=?').bind(report.grade+1,b.profile,report.grade)]);
  return publicYearProgress(b.profile);
}
export async function replaceOwnHeldLesson(pid:string,body:unknown){
  const b=z.object({id:z.string().uuid()}).strict().parse(body),a=await activityFor(b.id,pid);
  if(a.superseded_by)return {id:String(a.superseded_by)};
  if(a.status!=='held'||!a.course_context||!a.lesson_key)throw new HttpError('An educator can arrange a replacement for this lesson.',409);
  const count=await db().prepare('SELECT count(*) n FROM activities WHERE day_id=? AND lesson_key=?').bind(a.day_id,a.lesson_key).first();
  if(Number(count?.n)>=3)throw new HttpError('Two replacement attempts need review. Your adult can help; this target remains on your year’s unfinished list.',409);
  const id=uid(),result=await db().batch([
    db().prepare("INSERT INTO activities(id,day_id,subject,title,goal,prerequisite,minutes,position,standard_id,lesson_key,course_context,status,phase) SELECT ?,day_id,subject,title,goal,prerequisite,minutes,position,standard_id,lesson_key,course_context,'queued','research' FROM activities WHERE id=? AND status='held' AND superseded_by IS NULL AND (SELECT count(*) FROM activities b WHERE b.day_id=activities.day_id AND b.lesson_key=activities.lesson_key)<3").bind(id,b.id),
    db().prepare('UPDATE activities SET superseded_by=?,lock_token=NULL,locked_until=0 WHERE id=? AND superseded_by IS NULL AND EXISTS(SELECT 1 FROM activities WHERE id=?)').bind(id,b.id,id),
  ]);
  if(!result[0].meta.changes){const current=await activityFor(b.id,pid);if(current.superseded_by)return {id:String(current.superseded_by)};throw new HttpError('Refresh this lesson to see its current replacement.',409);}
  return {id};
}
export {mappedDay};
