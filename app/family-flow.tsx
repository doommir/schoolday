'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Check, Loader2, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {entryContext, entryHref, type EntryStep} from '@/lib/workflow';
import {ShareSample} from './share-sample';
import {SampleLesson} from './sample-lesson';
import {FamilyEntry} from './family-entry';
import {api} from './client-api';

export function FamilyFlow({initialStep='start', onBegin}: {initialStep?: EntryStep; onBegin?: () => Promise<void>}) {
  const [ready, setReady] = useState(false), [step, setStep] = useState<EntryStep>(initialStep), [grade, setGrade] = useState('6'), [source, setSource] = useState('direct');
  const [deviceCode, setDeviceCode] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const main = useRef<HTMLElement>(null), initialized = useRef(false);
  useEffect(() => {
    const restore = () => {const c = entryContext(location.search, initialStep); setGrade(c.grade); setSource(c.source); setStep(c.step);};
    restore(); setReady(true); window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [initialStep]);
  useEffect(() => {if(initialized.current) main.current?.focus(); initialized.current = true;}, [step]);
  function go(next: EntryStep, g = grade) {
    setError(''); setGrade(g); setStep(next);
    history.pushState({}, '', entryHref(next, g, source));
    window.scrollTo({top:0, behavior:'instant'});
  }
  function chooseGrade(g: string) {setGrade(g); history.replaceState({}, '', entryHref(step, g, source));}
  async function begin() {if(onBegin) await onBegin(); else location.assign('/?start=1');}
  async function redeem(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('redeem-device', {code:deviceCode});
      setDeviceCode(''); await begin();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  const current = step === 'family' ? 1 : 0;
  return <main className="family-flow" ref={main} tabIndex={-1}>
    <nav className="flow-nav" aria-label="Family navigation"><button className="flow-wordmark" onClick={()=>go('start')}><Sparkles size={22}/>schoolday<span>.</span></button><a href="/?adult=overview">Adult workspace</a></nav>
    <ol className="flow-progress" aria-label="Getting started">{['Try a lesson','Your family','Learning day'].map((label,i)=><li key={label} aria-current={i===current?'step':undefined} className={i<=current?'current':''}><span>{i<current?<Check size={14}/>:i+1}</span>{label}</li>)}</ol>
    {step!=='start'&&<div className="flow-back"><Button variant="ghost" onClick={()=>go(step==='family'?'preview':'start')}><ArrowLeft size={16}/>{step==='family'?'Free sample':'Choose a grade'}</Button>{step==='preview'&&<Button variant="ghost" onClick={()=>go('family')}>Continue family setup<ArrowRight size={16}/></Button>}</div>}
    {error&&<p className="thread-error" role="alert">{error}</p>}
    {step==='start'?<section className="flow-welcome">
      <span className="eyebrow">FOR HOMESCHOOL FAMILIES · GRADES 6–8</span>
      <h1>A school day.<br/>One next step.</h1>
      <p>Choose a grade and try a lesson. Keep going with a saved learning day across five subjects, Solo or in a small Squad.</p>
      <div className="grade-start"><label htmlFor="flow-grade">Learner’s grade</label><div><Select value={grade} onValueChange={chooseGrade}><SelectTrigger id="flow-grade"><SelectValue/></SelectTrigger><SelectContent>{[6,7,8].map(g=><SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select><Button className="primary" onClick={()=>go('preview')}>Try the learning flow<ArrowRight size={18}/></Button></div><p className="micro">Free sample · about 10 minutes · no account or card</p></div>
      <Button variant="ghost" className="flow-returning" onClick={()=>go('family')}>Already invited or have an account? Continue<ArrowRight size={16}/></Button>
      <div className="flow-benefits"><span><Check size={17}/>One activity at a time</span><span><Check size={17}/>Solo or Squads</span><span><Check size={17}/>Saved learner progress</span></div>
      <details className="student-code-entry"><summary>I have a learner device code</summary><form onSubmit={redeem}><label htmlFor="flow-device">Code from your adult</label><Input id="flow-device" autoComplete="off" placeholder="ABCD-1234-EF56-7890" value={deviceCode} maxLength={32} onChange={e=>setDeviceCode(e.target.value.toUpperCase())}/><Button className="primary" disabled={busy||deviceCode.replace(/[\s-]/g,'').length!==16}>{busy?<Loader2 className="spin"/>:null}Open my saved day<ArrowRight size={17}/></Button></form></details>
    </section>:step==='preview'?<SampleLesson key={grade} initialGrade={grade} onGradeChange={chooseGrade} onContinue={g=>go('family',g)}/>:ready?<FamilyEntry initialGrade={grade} source={source} onGradeChange={chooseGrade} onBegin={begin} onPreview={()=>go('preview')}/>:<p role="status">Opening your family setup…</p>}
    {step==='preview'&&<ShareSample grade={grade}/>}
    <footer className="flow-footer"><p>Parent-led homeschool software. School enrollment and a live teacher are arranged separately.</p><a href="/family-guide">Family guide & subject coverage</a><a href="/privacy">Privacy policy</a><a href="/terms">Subscription terms</a><a href="/support">Support</a></footer>
  </main>;
}
