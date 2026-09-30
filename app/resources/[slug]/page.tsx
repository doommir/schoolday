import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {familyResources} from '@/lib/family-resources';
import {FamilyOffer} from '@/app/start/family-offer';

type Props={params:Promise<{slug:string}>};
const origin='https://schoolday-os.sickyicky.chatgpt.site';
const hints:Record<number,string>={
 6:'Draw one liter as eight equal parts. Mark the amount in the jug. How many serving-sized parts did you mark?',
 7:'Label the units before dividing. How could you find the cost of just one notebook in each offer?',
 8:'Make a table for 0, 1 and 2 hours. What stays the same between rows? What does the cost at zero tell you?',
};
export function generateStaticParams(){return familyResources.map(r=>({slug:r.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params,r=familyResources.find(r=>r.slug===slug);
 return r?{title:r.title+' · Schoolday',description:r.description,alternates:{canonical:origin+'/resources/'+r.slug}}:{title:'Guide not found',robots:{index:false}};
}
export default async function Resource({params}:Props){
 const {slug}=await params,r=familyResources.find(r=>r.slug===slug);
 if(!r)notFound();
 const isMath=r.slug==='middle-school-math-check-at-home';
 const isSchedule=r.slug==='middle-school-homeschool-schedule';
 const isChecklist=r.slug==='middle-school-curriculum-checklist';
 const updatedValue='updated' in r?String(r.updated):null;
 const updatedLabel=updatedValue?new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(updatedValue+'T00:00:00Z')):null;
 const sampleHref=(grade:number)=>'/try?grade='+grade+'&utm_source=guide_'+r.slug.replaceAll('-','_');
 const article={"@context":"https://schema.org","@type":"Article",headline:r.title,description:r.description,url:origin+'/resources/'+r.slug,author:{"@type":"Organization",name:"NovaPath LLC"},...('updated' in r?{dateModified:r.updated}:{}),articleBody:r.sections.map(s=>s.title+'. '+s.body+' '+s.items.join(' ')).join('\n')};
 return <main className="acquisition resource-guide">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(article).replaceAll('<','\\u003c')}}/>
  <nav><a href="/start">Schoolday <strong>OS</strong></a><a href="/resources">Parent guides</a></nav>
  <header><span className="eyebrow">NOVAPATH · PARENT GUIDE</span><h1>{r.title}</h1><p>{r.intro}</p>
   {isMath&&<><p>Start with their grade. Use an earlier task if it helps; these questions do not assign a level.</p><nav aria-label="Choose a math task">{[6,7,8].map(g=><a key={g} href={'#grade-'+g}>Grade {g} task</a>)}</nav></>}
   {updatedValue&&<p>Updated <time dateTime={updatedValue}>{updatedLabel}</time></p>}
  </header>
  <article>{r.sections.map(s=>{
   const grade=isMath?Number(s.title.match(/^Grade ([678]):/)?.[1]):0;
   const answers=<ul>{s.items.map(i=><li key={i}>{i}</li>)}</ul>;
   return <section key={s.title} id={grade?'grade-'+grade:undefined}>
    <h2>{s.title}</h2><p>{s.body}</p>
    {grade?<><details><summary>Need a hint? Grade {grade}</summary><p>{hints[grade]}</p></details><details><summary>Show the worked answer · grade {grade}</summary>{answers}</details><p><a href={sampleHref(grade)}>Try the free grade {grade} math sample</a></p><p>The sample teaches {grade===6?'unit rates':grade===7?'scale drawings':'starting values and rates'} in a fixed lesson. It is not AI-generated, a placement test or a complete school day. No account or card.</p></>:answers}
   </section>;
  })}
  {'sources' in r&&<section><h2>{isSchedule||isChecklist?'Sources and limits':'Why these prompts?'}</h2>{r.sources.map(source=><p key={source.url}><a href={source.url}>{source.title}</a>. {source.note}</p>)}{isSchedule?<p>To try the learning flow, use <a href={sampleHref(6)}>the free grade 6 sample</a>, <a href={sampleHref(7)}>grade 7 sample</a> or <a href={sampleHref(8)}>grade 8 sample</a>. To choose between independent and group work, see <a href="/resources/solo-and-asynchronous-homeschool">Solo and Squad options</a>.</p>:isChecklist?<p>Audit a real workflow with <a href={sampleHref(6)}>the free grade 6 sample</a>, <a href={sampleHref(7)}>grade 7 sample</a> or <a href={sampleHref(8)}>grade 8 sample</a>. For a worked parent check, see <a href="/resources/middle-school-math-check-at-home">the middle-school math guide</a>. For daily planning, use <a href="/resources/middle-school-homeschool-schedule">the schedule guide</a>.</p>:<p>To plan the next session, see <a href="/resources/middle-school-homeschool-schedule">a flexible middle-school routine</a>. To compare learning options, use <a href="/resources/middle-school-curriculum-checklist">the curriculum checklist</a>.</p>}</section>}
  </article>
  <section className="workspace-card"><h2>See the learning steps for yourself</h2><p>Choose a grade for a free original math sample. No account or card. Generated learning is separate; review current access and terms below.</p><div className="launch-links">{[6,7,8].map(g=><a key={g} className="primary workspace-link" href={sampleHref(g)}>Try grade {g}</a>)}</div></section>
  <FamilyOffer/>
  <footer><a href="/resources">More parent guides</a><p>Schoolday is parent-led learning software. School enrollment and a live teacher are arranged separately.</p><a href="/family-guide">Family guide and subject coverage</a></footer>
 </main>;
}
