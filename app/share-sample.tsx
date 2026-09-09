'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {validGrade} from '@/lib/workflow';
export function ShareSample({grade}:{grade:string}){const [status,setStatus]=useState('');const url='https://schoolday-os.sickyicky.chatgpt.site/try?grade='+validGrade(grade)+'&utm_source=parent_referral';async function share(){try{if(navigator.share){await navigator.share({title:'Try a Schoolday math lesson',text:'A free middle-school math sample. No account or card.',url});setStatus('Share window closed.');}else{await navigator.clipboard.writeText(url);setStatus('Sample link copied.');}}catch(e){if((e as Error).name!=='AbortError')setStatus('Copy the sample link below.');}}return <div className="sample-share"><Button variant="outline" onClick={share}>Share the free sample with a parent</Button><p role="status" className="micro">{status}</p>{status==='Copy the sample link below.'&&<a href={url}>{url}</a>}</div>}
