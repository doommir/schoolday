import {consentFor,requireConsent} from './privacy-controls';
import {z} from 'zod';
import {account,identity,setupAccount} from './accounts';
import {adultAllowed} from './adult-lock';
import {accountOverview,billingConfig} from './billing';
import {salesOpen} from './launch';
import {db,hash,HttpError,now,runtime,setting,uid} from './server';

export async function pilotForEmail(email:string){const allowed=JSON.parse(await setting('pilot_emails')||'[]');return Array.isArray(allowed)&&allowed.includes(email.toLowerCase());}
export async function familyEntry(){const data=await accountOverview(),who=await identity(),c=await billingConfig();const connected=!!(runtime().OPENAI_API_KEY||await setting('ai_key'));const pilot=!!who&&!data.locked&&await pilotForEmail(who.email);const price=c?.prices.family;const canBuy=c?.mode==='live'&&await salesOpen()&&price?.amount===2900&&price?.interval==='month'&&price?.intervalCount===1;
 const learners=data.account?(await db().prepare('SELECT p.id,p.name,p.grade,EXISTS(SELECT 1 FROM days d WHERE d.profile_id=p.id) AS has_saved_day FROM profiles p JOIN account_learners l ON l.profile_id=p.id WHERE l.account_id=? ORDER BY l.created_at,l.profile_id').bind(data.account.id).all()).results:[];
 const pinSet=!!who&&!!await db().prepare('SELECT account_id FROM adult_security WHERE account_id=?').bind(who.id).first();
 return {...data,consent:data.account?await consentFor(String(data.account.id)):null,pilot,connected,canBuy:!!canBuy,canBegin:connected&&(pilot||!!data.entitlement?.licensed),pinSet,learners:learners.map((p,i)=>({...p,canResume:!!p.has_saved_day,canBegin:connected&&(pilot||!!data.entitlement?.licensed&&i<Number(data.entitlement?.quantity))})),learnerDailyLimit:Number(await setting('learner_daily_limit')||60)};
}
export async function onboardFamily(body:unknown){const b=z.object({name:z.string().trim().min(1).max(50),grade:z.number().int().min(6).max(8),pin:z.string().regex(/^\d{6}$/).optional(),adult:z.literal(true)}).strict().parse(body);const who=await identity();if(!who)throw new HttpError('Sign in as the adult to continue.',401);if(!await adultAllowed())throw new HttpError('Unlock your adult account to continue.',423);const entry=await familyEntry();if(entry.account?.kind==='organization')throw new HttpError('Open your school workspace to manage this account.',409);if(!entry.canBuy&&!entry.pilot&&!entry.entitlement?.licensed)throw new HttpError('Generated family access is not open yet. Join the launch list or use your pilot invitation.',409);
 await requireConsent(who.id);
 const lock='family_setup_lock:'+who.id,lease=String(Date.now()+60000)+uid();const acquired=await db().prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value WHERE CAST(substr(settings.value,1,13) AS INTEGER)<?').bind(lock,lease,Date.now()).run();if(!acquired.meta.changes)throw new HttpError('Your family setup is already saving. Wait a moment, then continue.',409);
 try{let recovery:string|null=null;const a=await account(false);const pinExists=await db().prepare('SELECT account_id FROM adult_security WHERE account_id=?').bind(who.id).first();if(!pinExists&&!b.pin)throw new HttpError('Choose a six-digit PIN to protect adult controls.',400);if(!a||!pinExists){const saved=await setupAccount({name:a?.name||'My family',kind:'family',adult:true,...(!pinExists?{pin:b.pin}:{})});recovery=saved.recovery;}
 const existing=await db().prepare('SELECT p.id,p.name,p.grade FROM profiles p JOIN account_learners l ON p.id=l.profile_id WHERE l.account_id=? ORDER BY l.created_at,l.profile_id LIMIT 1').bind(who.id).first();if(existing)return {profile:existing,recovery};
 const reservation='family_first_learner:'+who.id,pid=uid(),token=await hash(uid()+uid());
 await db().batch([db().prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO NOTHING').bind(reservation,pid),db().prepare('INSERT INTO profiles(id,session,name,grade,created_at) SELECT value,?,?,?,? FROM settings WHERE id=? ON CONFLICT(id) DO NOTHING').bind(token,b.name,b.grade,now(),reservation),db().prepare('INSERT INTO account_learners(profile_id,account_id,created_at) SELECT value,?,? FROM settings WHERE id=? ON CONFLICT(profile_id) DO NOTHING').bind(who.id,now(),reservation)]);
 const profile=await db().prepare('SELECT p.id,p.name,p.grade FROM profiles p JOIN account_learners l ON l.profile_id=p.id WHERE l.account_id=? ORDER BY l.created_at,l.profile_id LIMIT 1').bind(who.id).first();if(!profile)throw new HttpError('Setup could not finish. Your adult account is saved; try again.',503);return {profile,recovery};
 }finally{await db().prepare('DELETE FROM settings WHERE id=? AND value=?').bind(lock,lease).run();}
}
