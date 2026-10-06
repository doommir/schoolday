'use client';
import {useEffect,useState} from 'react';
import {entryContext,entryHref} from '@/lib/workflow';

type Availability = 'loading' | 'open' | 'closed' | 'error';

export function FamilyOffer(){
 const [availability,setAvailability]=useState<Availability>('loading');
 const [attempt,setAttempt]=useState(0);
 const [joinHref,setJoinHref]=useState('/join');
 useEffect(()=>{
  const context=entryContext(location.search);
  setJoinHref(entryHref('family',context.grade,context.source));
  const controller=new AbortController();
  let gone=false;
  const timeout=setTimeout(()=>controller.abort(),15000);
  setAvailability('loading');
  fetch('/api/family-offer',{signal:controller.signal,cache:'no-store'})
   .then(async response=>{
    if(!response.ok)throw new Error('Offer unavailable');
    const offer=await response.json();
    if(!offer||typeof offer!=='object'||!('available' in offer)||typeof offer.available!=='boolean')throw new Error('Invalid offer');
    if(!gone)setAvailability(offer.available?'open':'closed');
   })
   .catch(()=>{if(!gone)setAvailability('error')})
   .finally(()=>clearTimeout(timeout));
  return()=>{gone=true;clearTimeout(timeout);controller.abort()};
 },[attempt]);
 return <section className="workspace-card family-offer">
  <span className="eyebrow">FAMILY LEARNING · ONE LEARNER</span>
  <h2>{availability==='closed'?'Planned launch price: $49 / month':'$49 / month'}</h2>
  <p>Grades 6–8 core learning, Solo and Squads, parent review, and the homeschool organizer. One monthly subscription per learner. No annual commitment.</p>
  <p>School enrollment, a live teacher, full-year curriculum coverage, and courses outside the generated core are arranged separately. Generation uses a daily preparation allowance; prepared work stays available when preparation pauses. Review the allowance and policies before checkout.</p>
  <a href="/family-guide">See the California family guide and subject coverage</a>
  <div aria-live="polite" aria-busy={availability==='loading'}>
   {availability==='loading'&&<p role="status">Checking family plan availability…</p>}
   {availability==='open'&&<><p>Cancel future renewals in the billing portal. Access continues to the paid period’s end. Applicable taxes appear at checkout.</p><a className="primary workspace-link" href={joinHref}>Continue with your family</a></>}
   {availability==='closed'&&<p>Generated learning is in a limited pilot. Try the free sample, then leave an adult email for availability updates.</p>}
   {availability==='error'&&<><p>We couldn’t check plan availability. You can still try the free sample above.</p><button type="button" className="secondary" onClick={()=>setAttempt(value=>value+1)}>Check availability again</button></>}
  </div>
 </section>
}
