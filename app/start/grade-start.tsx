'use client';
import {useEffect,useState} from 'react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {campaignSource} from '@/lib/pipeline-content';
import {entryHref,entryContext} from '@/lib/workflow';
export function GradeStart(){const [grade,setGrade]=useState('6'),[source,setSource]=useState('direct');useEffect(()=>{const context=entryContext(location.search);setGrade(context.grade);setSource(context.source)},[]);return <div className="grade-start"><label htmlFor="sample-grade">Choose a grade</label><div><Select value={grade} onValueChange={setGrade}><SelectTrigger id="sample-grade"><SelectValue/></SelectTrigger><SelectContent>{[6,7,8].map(g=><SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select><a className="primary workspace-link" href={entryHref('preview',grade,source)}>Try a free lesson →</a></div><p className="micro">About 10 minutes. No account or card.</p></div>}
