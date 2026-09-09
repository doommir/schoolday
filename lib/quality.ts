import {lessonSchema} from './generation-schema';
import {allowedDomains} from './references';
import type {Lesson,Review} from './types';
export function allowedSource(url:string){try{const u=new URL(url);return u.protocol==='https:'&&allowedDomains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}}
export function checkLesson(raw:unknown,grade:number,subject:string,sourceURLs:string[]=[],standardId?:string,plannedMinutes?:number):string[]{
 const p=lessonSchema.safeParse(raw);if(!p.success)return p.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`);
 const l=p.data;const issues:string[]=[];
 if(standardId&&l.alignment.standardId!==standardId)issues.push('The lesson must target the exact assigned standard.');
 if(plannedMinutes&&Math.abs(l.stages.reduce((n,s)=>n+s.minutes,0)+6-plannedMinutes)>10)issues.push('Lesson stages plus six minutes for exit checks must fit the planned time within ten minutes.');
 const prompts=[l.stages[3].prompt,...l.checks.map(c=>c.question)].map(s=>s.trim().toLowerCase().replace(/[^a-z0-9]/g,''));if(new Set(prompts).size!==3)issues.push('Practice and exit checks must use distinct questions.');
 if(l.grade!==grade||l.subject!==subject)issues.push('Grade and subject must match the assigned plan.');
 const order=['notice','teach','model','practice','apply','reflect'];if(l.stages.some((s,i)=>s.kind!==order[i]))issues.push('Six stages must follow notice, teach, model, practice, apply, reflect.');
 const practice=l.stages[3];if(practice.options.length<3||practice.answer<0||practice.answer>=practice.options.length)issues.push('Practice needs at least 3 options and a valid answer.');
 if(practice.hint.length<20)issues.push('Practice needs a useful reteaching hint.');
 if(l.stages[4].rubric.length<2||l.stages[4].example.length<40)issues.push('Application needs success criteria and a worked exemplar.');
 for(const [i,s]of l.stages.entries()){
 if(s.options.length&&(s.answer<0||s.answer>=s.options.length))issues.push(`Stage ${i}: answer is outside choices.`);
 if(s.options.length===0&&s.answer!==-1)issues.push(`Stage ${i}: use answer -1 when no options exist.`);
 if(s.options.length&&s.options.length!==new Set(s.options.map(o=>o.text.trim().toLowerCase())).size)issues.push(`Stage ${i}: duplicate choices.`);
 if(s.visual.kind==='fraction'&&(s.visual.values.length!==2||!Number.isInteger(s.visual.values[0])||!Number.isInteger(s.visual.values[1])||s.visual.values[1]<1||s.visual.values[1]>16||s.visual.values[0]<0||s.visual.values[0]>s.visual.values[1]))issues.push(`Stage ${i}: fraction visual must be numerator, denominator of a proper fraction, denominator 1–16.`);
 if(s.visual.kind==='bar'&&(s.visual.labels.length!==s.visual.values.length||s.visual.values.some(n=>n<0)))issues.push(`Stage ${i}: bar labels and nonnegative values must match.`);
 if(s.visual.kind==='numberline'&&(s.visual.values.length!==3||s.visual.values[0]>=s.visual.values[1]||s.visual.values[2]<s.visual.values[0]||s.visual.values[2]>s.visual.values[1]))issues.push(`Stage ${i}: number line values must be minimum, maximum, point within range.`);
 }
 if(grade<=2&&l.stages.some(s=>s.minutes>15))issues.push('K–2 segments must be no longer than 15 minutes.');
 for(const c of l.checks){if(c.answer>=c.options.length)issues.push('Exit check answer is outside options.');if(new Set(c.options.map(o=>o.text.trim().toLowerCase())).size!==c.options.length)issues.push('Exit check has duplicate options.');}
 if(l.sources.some(s=>!allowedSource(s.url)||!sourceURLs.includes(s.url)))issues.push('Every cited source must be an exact URL from the retrieved source pack.');
 if(l.stages[1].content.length<(grade<=2?180:500))issues.push('Teaching stage lacks enough explicit instruction or included reading.');
 if(l.stages[2].content.length<180)issues.push('Model must explain thinking, not just give an answer.');
 return issues;
}
export function reviewsPass(reviews:Review[],alignment=false){const roles=['Subject accuracy reviewer','Instruction and accessibility reviewer','Standards alignment reviewer'];return reviews.length===(alignment?3:2)&&(!alignment||roles.every(role=>reviews.filter(r=>r.role===role).length===1))&&reviews.every(r=>r.pass&&!r.issues.some(i=>i.severity==='blocker'||i.severity==='major'));}
export function verifySolutions(review:Review,lesson:Lesson){const expected=[lesson.stages[3].answer,...lesson.checks.map(c=>c.answer)],names=['practice','check1','check2'];return names.every((item,i)=>review.solutions?.filter(s=>s.item===item).length===1&&review.solutions?.find(s=>s.item===item)?.answerIndex===expected[i]);}
// A separate request is not independent if the author supplies its answer keys.
export function blindAccuracyLesson(lesson:Lesson){
 return {...lesson,stages:lesson.stages.map(({answer,options,hint,example,...stage})=>({...stage,options:options.map(({text})=>({text})),...(stage.kind==='practice'?{}:{hint,example})})),checks:lesson.checks.map(({question,options})=>({question,options:options.map(({text})=>({text}))}))};
}
export function studentLesson(l:Lesson){return {...l,stages:l.stages.map(s=>({...s,answer:-1,options:s.options.map(o=>({text:o.text,feedback:''}))})),checks:l.checks.map(c=>({...c,answer:-1,options:c.options.map(o=>({text:o.text,feedback:''}))}))};}
