import catalog from '../data/standards-catalog.json';

export const yearVersion = 'ca-core-year-2026-09-08-v1';
export const yearLength = 180;
export const coreSubjects = ['Literacy','Math','Science','Humanities','Studio'] as const;
export type CoreSubject = typeof coreSubjects[number];
type Standard = typeof catalog[number];
type Definition = {title:string; prefixes:string[]; purpose:string};
export type CourseUnit = Definition & {id:string; subject:CoreSubject; standards:Standard[]; start:number; end:number};
const unit = (title:string,prefixes:string[],purpose:string):Definition => ({title,prefixes,purpose});
const math:Record<number,Definition[]> = {
  6:[
    unit('Fraction division',['6.NS.1'],'Represent quotients with equal-sized units, diagrams, and contextual problems.'),
    unit('Fluent computation',['6.NS.2','6.NS.3','6.NS.4'],'Connect place value, division, decimal operations, factors, and multiples.'),
    unit('Ratios and rates',['6.RP'],'Use ratio tables, diagrams, unit rates, percentages, and measurement conversions.'),
    unit('Rational numbers',['6.NS.5','6.NS.6','6.NS.7','6.NS.8'],'Locate and compare rational numbers, explain absolute value, and use coordinates.'),
    unit('Expressions',['6.EE.1','6.EE.2','6.EE.3','6.EE.4'],'Write, evaluate, and justify equivalent expressions using structure.'),
    unit('Equations and relationships',['6.EE.5','6.EE.6','6.EE.7','6.EE.8','6.EE.9'],'Represent constraints and related quantities with equations, inequalities, tables, and graphs.'),
    unit('Geometry and measurement',['6.G'],'Reason about area, surface area, and volume with diagrams and units.'),
    unit('Statistical questions',['6.SP'],'Describe distributions, variability, center, and the context of collected data.'),
  ],
  7:[unit('Proportional relationships',['7.RP.1','7.RP.2'],'Connect unit rates, tables, graphs, and proportional equations.'),unit('Percent reasoning',['7.RP.3'],'Solve multistep percent problems and explain the reference quantity.'),unit('Signed numbers',['7.NS.1'],'Use rational-number addition and subtraction in context.'),unit('Rational operations',['7.NS.2','7.NS.3'],'Explain multiplication and division of rational numbers and solve contextual problems.'),unit('Expressions and equations',['7.EE'],'Use equivalent expressions, equations, and inequalities to solve problems.'),unit('Geometry',['7.G'],'Reason about scale, constructions, cross sections, angles, area, and volume.'),unit('Sampling and comparisons',['7.SP.1','7.SP.2','7.SP.3','7.SP.4'],'Use samples and variability to compare populations cautiously.'),unit('Probability',['7.SP.5','7.SP.6','7.SP.7','7.SP.8'],'Connect probability models, observed frequencies, simulations, and compound events.')],
  8:[unit('Real numbers and exponents',['8.NS','8.EE.1','8.EE.2','8.EE.3','8.EE.4'],'Explain irrational numbers, integer exponents, roots, and scientific notation.'),unit('Linear relationships',['8.EE.5','8.EE.6'],'Connect unit rate and slope across equations, graphs, and similar triangles.'),unit('Equations and systems',['8.EE.7','8.EE.8'],'Solve linear equations and systems, interpreting solutions in context.'),unit('Functions',['8.F'],'Compare functions and describe relationships with multiple representations.'),unit('Transformations and similarity',['8.G.1','8.G.2','8.G.3','8.G.4','8.G.5'],'Use transformations to explain congruence, similarity, and angle relationships.'),unit('The Pythagorean theorem',['8.G.6','8.G.7','8.G.8'],'Explain and apply the theorem, including coordinate distance.'),unit('Volume',['8.G.9'],'Use and compare volume formulas for cylinders, cones, and spheres.'),unit('Bivariate data',['8.SP'],'Interpret scatter plots, linear models, and two-way tables.')],
};
const science:Record<number,Definition[]> = {
  6:[unit('Cells and body systems',['MS-LS1-1','MS-LS1-2','MS-LS1-3'],'Use models and evidence to connect cells, tissues, and interacting systems.'),unit('Growth, inheritance, and information',['MS-LS1-4','MS-LS1-5','MS-LS1-8','MS-LS3-2'],'Explain growth, reproduction, inherited information, and responses using evidence.'),unit('Thermal energy',['MS-PS3'],'Investigate energy transfer with safe observations, supplied data, and models.'),unit('Water, weather, and climate',['MS-ESS2'],'Explain water cycling, weather patterns, and climate with interacting-system models.'),unit('Human choices and climate',['MS-ESS3'],'Evaluate evidence and design approaches to reducing environmental impacts.'),unit('Engineering design',['MS-ETS1'],'Define constraints, compare solutions, analyze tests, and improve a design.')],
  7:[unit('Matter and its changes',['MS-PS1'],'Model particles and chemical changes; use supplied or safely observed data to account for matter and energy.'),unit('Energy and ecosystems',['MS-LS1','MS-LS2'],'Explain energy flow, matter cycling, resource competition, and ecosystem change.'),unit('Earth systems and resources',['MS-ESS2','MS-ESS3'],'Explain the rock cycle, geological evidence, resources, and natural-hazard patterns.'),unit('Engineering for changing systems',['MS-ETS1'],'Compare solutions against criteria, analyze tests, and iteratively improve a model.')],
  8:[unit('Forces and motion',['MS-PS2','MS-PS3'],'Use evidence and models to explain motion, interactions, and potential and kinetic energy.'),unit('Waves and information',['MS-PS4'],'Model wave behavior and explain how information can be transmitted.'),unit('Inheritance and change over time',['MS-LS3','MS-LS4'],'Use evidence about variation, inheritance, and selection to explain biological change.'),unit('Earth and space',['MS-ESS1'],'Use models and patterns to explain the Earth-Moon-Sun system, gravity, and geological time.'),unit('Resources and design',['MS-ESS3','MS-ETS1'],'Evaluate resource-use evidence and improve constrained engineering solutions.')],
};
const historyTitles:Record<number,string[]>={6:['Early humans','Mesopotamia, Egypt, and Kush','Ancient Hebrews','Ancient Greece','Ancient India','Ancient China','Ancient Rome'],7:['Rome and Byzantium','The Islamic world','Medieval China','West African states','Medieval Japan','Medieval Europe','Mesoamerican and Andean civilizations','The Renaissance','The Reformation','The Scientific Revolution','The Enlightenment and revolutions'],8:['Foundations of independence','The Constitution','Early government','The new republic','Foreign policy','The changing North','The changing South','Westward expansion','Slavery and abolition','The Civil War','Reconstruction','Industrial America']};
function literacy(g:number):Definition[]{return [unit('Reading for evidence',[`RI.${g}.1`,`RI.${g}.2`,`RI.${g}.3`,`RI.${g}.10`],'Read sustained informational texts, distinguish evidence from inference, and explain central ideas.'),unit('Stories and interpretation',[`RL.${g}.1`,`RL.${g}.2`,`RL.${g}.3`,`RL.${g}.4`,`RL.${g}.5`,`RL.${g}.6`],'Read original or appropriately licensed literature and support interpretations of structure, character, and theme.'),unit('Arguments and media',[`RI.${g}.4`,`RI.${g}.5`,`RI.${g}.6`,`RI.${g}.7`,`RI.${g}.8`,`RI.${g}.9`],'Analyze argument, perspective, structure, and evidence across informational sources and media.'),unit('Comparing literature',[`RL.${g}.7`,`RL.${g}.9`,`RL.${g}.10`],'Compare texts and adaptations, using included passages and clear evidence.'),unit('Language and vocabulary',[`L.${g}`],'Develop conventions, sentence craft, word knowledge, and vocabulary in meaningful reading and writing.'),unit('Discussion and presentation',[`SL.${g}`],'Prepare evidence, listen, discuss, and present; arrange an adult or peer audience when interaction is required.'),unit('Writing and research',[`W.${g}`],'Compose, revise, research, cite, and publish for a purpose and audience.')];}
function studio(g:number):Definition[]{return [unit('An explanatory portfolio',[`W.${g}.2`,`W.${g}.4`,`W.${g}.5`],'Build an explanation from planning through revision. Keep earlier drafts available in My work.'),unit('A narrative portfolio',[`W.${g}.3`,`W.${g}.4`,`W.${g}.5`],'Develop a narrative with deliberate pacing, description, organization, and revision.'),unit('An evidence-based argument',[`W.${g}.1`,`W.${g}.4`,`W.${g}.5`],'Develop a claim, evaluate evidence, address alternatives, and revise the argument.'),unit('A research inquiry',[`W.${g}.7`,`W.${g}.8`,`W.${g}.9`],'Investigate a bounded question, evaluate sources, synthesize findings, and acknowledge sources.'),unit('Publish and reflect',[`W.${g}.6`,`W.${g}.10`],'Use accessible tools to publish, share, and reflect on sustained and shorter writing.')];}
const matches=(id:string,prefix:string)=>id===prefix||id.startsWith(prefix+'.')||id.startsWith(prefix+'-');
// CDE explicitly marks RL.6.8 / RL.7.8 / RL.8.8 as not applicable to literature.
export function yearStandards(grade:number,subject:CoreSubject){return catalog.filter(s=>s.grade===grade&&s.subject===subject&&!/^RL\.[678]\.8$/.test(s.id));}
export function courseUnits(grade:number,subject:CoreSubject):CourseUnit[]{
  if(![6,7,8].includes(grade))throw Error('Choose grade 6, 7, or 8.');
  const defs=subject==='Math'?math[grade]:subject==='Science'?science[grade]:subject==='Humanities'?historyTitles[grade].map((title,i)=>unit(title,[`HSS-${grade}.${i+1}`],'Analyze chronology, geography, causation, perspective, and authentic historical sources.')):subject==='Literacy'?literacy(grade):studio(grade);
  const targets=yearStandards(grade,subject);
  const groups=defs.map(d=>({...d,standards:d.prefixes.flatMap(prefix=>targets.filter(s=>matches(s.id,prefix)).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}))).filter((s,i,all)=>all.findIndex(t=>t.id===s.id)===i)}));
  const missing=targets.filter(s=>!groups.some(g=>g.standards.some(t=>t.id===s.id)));
  if(missing.length||groups.some(g=>!g.standards.length))throw Error('The year map has an unmapped or empty unit: '+grade+' '+subject+' '+missing.map(s=>s.id).join(','));
  const minimum=groups.reduce((n,g)=>n+g.standards.length+2,0),extra=yearLength-minimum,weight=groups.reduce((n,g)=>n+g.standards.length,0);
  if(extra<0)throw Error('The course needs more than 180 learning days.');
  const lengths=groups.map(g=>g.standards.length+2+Math.floor(extra*g.standards.length/weight));
  for(let left=yearLength-lengths.reduce((a,b)=>a+b,0),i=0;left>0;left--,i++)lengths[i%lengths.length]++;
  let start=1;return groups.map((g,i)=>{const u={...g,id:`${grade}-${subject}-${i+1}`,subject,start,end:start+lengths[i]-1};start=u.end+1;return u;});
}
export type YearContext={version:string;day:number;week:number;subject:CoreSubject;unitId:string;unit:string;unitStart:number;unitEnd:number;purpose:string;standardId:string;stage:string;targetLesson:number;targetLessons:number;reviewTargets:string[]};
export function dayAssignment(grade:number,day:number,subject:CoreSubject):YearContext {
  if(!Number.isInteger(day)||day<1||day>yearLength)throw Error('This course contains 180 learning days.');
  const u=courseUnits(grade,subject).find(u=>day>=u.start&&day<=u.end)!,offset=day-u.start,instructionDays=u.end-u.start-1;
  const review=offset>=instructionDays,idx=review?(offset-instructionDays)%u.standards.length:Math.floor(offset*u.standards.length/instructionDays);
  const targetStart=Math.ceil(idx*instructionDays/u.standards.length),targetEnd=Math.ceil((idx+1)*instructionDays/u.standards.length),part=offset-targetStart;
  const stage=review?(day===u.end?'Unit check and reflection':'Spaced review and repair'):part===0?'Explain and model':part===1?'Guided practice and application':part===targetEnd-targetStart-1?'Independent transfer':'Deepen and connect';
  return {version:yearVersion,day,week:Math.ceil(day/5),subject,unitId:u.id,unit:u.title,unitStart:u.start,unitEnd:u.end,purpose:u.purpose,standardId:u.standards[idx].id,stage,targetLesson:review?1:part+1,targetLessons:review?1:targetEnd-targetStart,reviewTargets:review?u.standards.map(s=>s.id):[]};
}
export function mappedDay(grade:number,day:number,history:Array<{subject?:unknown;standard_id?:unknown;correct?:unknown}>=[]){
  const items=coreSubjects.map(subject=>{
    const context=dayAssignment(grade,day,subject);
    if(context.reviewTargets.length){const weak=history.find(h=>h.subject===subject&&h.correct===0&&context.reviewTargets.includes(String(h.standard_id)));if(weak)context.standardId=String(weak.standard_id);}
    return {subject,standardId:context.standardId,title:context.unit+' · '+context.stage.toLowerCase(),goal:`${context.purpose} Focus on ${context.standardId}; ${context.stage.toLowerCase()}.`,prerequisite:'Check the prior idea with a short example, then provide support without replacing the grade-level target.',minutes:40,context};
  });
  return {theme:`Week ${Math.ceil(day/5)} · Build, apply, reflect`,question:'What can you explain with evidence today?',items};
}

type CoverageEntry={year_day:unknown;subject:unknown;standard_id:unknown;status:unknown;responses:unknown;checks:unknown};
export function auditYearEvidence(grade:number,entries:CoverageEntry[]){
  const slots=new Map<string,CoverageEntry[]>();
  for(const entry of entries){const key=`${entry.year_day}:${entry.subject}`;slots.set(key,[...(slots.get(key)||[]),entry]);}
  const gaps:Array<{day:number;subject:CoreSubject;standardId:string;reason:string}>=[];
  for(const subject of coreSubjects)for(let day=1;day<=yearLength;day++){
    const target=dayAssignment(grade,day,subject),rows=slots.get(`${day}:${subject}`)||[];
    const row=rows[0],allowed=target.reviewTargets.length?target.reviewTargets:[target.standardId];
    const reason=rows.length===0?'Not yet assigned':rows.length!==1?'Duplicate active assignments':!allowed.includes(String(row.standard_id))?'Assigned target differs from the year map':row.status!=='complete'||Number(row.responses)!==8||Number(row.checks)!==2?'Learning evidence unfinished':'';
    if(reason)gaps.push({day,subject,standardId:target.standardId,reason});
  }
  const unexpected=entries.filter(e=>!Number.isInteger(Number(e.year_day))||Number(e.year_day)<1||Number(e.year_day)>yearLength||!coreSubjects.includes(e.subject as CoreSubject)).length;
  return {expected:yearLength*coreSubjects.length,verified:yearLength*coreSubjects.length-gaps.length,complete:gaps.length===0&&unexpected===0,unexpected,gaps};
}
