import {campaignSource} from './pipeline-content';

export type EntryStep = 'start' | 'preview' | 'family';
export const validGrade = (grade: unknown): string => ['6', '7', '8'].includes(String(grade)) ? String(grade) : '6';

// Only public flow context belongs in return URLs. Never include learner details or PINs.
export function entryHref(step: EntryStep, grade: unknown = '6', source: unknown = 'direct', sessionId = '') {
  const q = new URLSearchParams({flow: step, grade: validGrade(grade), utm_source: campaignSource(source)});
  if (sessionId) q.set('session_id', sessionId);
  return '/?' + q.toString();
}

export function entryContext(search: string, fallback: EntryStep = 'start') {
  const q = new URLSearchParams(search), flow = q.get('flow');
  return {
    step: (flow === 'start' || flow === 'preview' || flow === 'family' ? flow : fallback) as EntryStep,
    grade: validGrade(q.get('grade')),
    source: campaignSource(q.get('utm_source')),
  };
}

type Block = {id: string; status: string};
export function nextLearningActivity<T extends Block>(activities: T[], savedId?: string | null, excludedId?: string, preparedOnly=false) {
  const available = activities.filter(a => a.id !== excludedId && !['complete', 'held', 'superseded'].includes(a.status) && (!preparedOnly || a.status === 'ready'));
  return available.find(a => a.id === savedId) || available[0];
}

export function learningContinuation<T extends Block>(activities: T[], state?: {activity_id?: string | null; room_code?: string | null; mode?: string} | null, excludedId?: string, preparedOnly=false) {
  const activity = nextLearningActivity(activities, state?.activity_id, excludedId, preparedOnly);
  const roomCode = activity && activity.id === state?.activity_id && state?.mode?.startsWith('squad') ? state.room_code || null : null;
  return {activity, roomCode};
}

// Returning to an existing day is a read, even if generation or billing is paused.
export async function resumeOrPlanDay(request:(path:string,body?:unknown)=>Promise<any>,canPrepare:boolean){
  const saved=await request('day');
  if(!saved.day&&canPrepare)await request('plan',{});
}
