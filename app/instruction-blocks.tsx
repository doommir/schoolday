export function InstructionBlocks({content,model=false}:{content?:string;model?:boolean}) {
 const paragraphs=(content||'').split('\n').map(p=>p.trim()).filter(Boolean);
 return model?<ol className="worked-steps" aria-label="Worked example steps">{paragraphs.map((p,i)=><li key={i}><span aria-hidden="true">{i+1}</span><p>{p}</p></li>)}</ol>:<div className="instruction-text">{paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>;
}
export function LessonTrail({step,labels}:{step:number;labels:string[]}) {
 return <ol className="lesson-trail" aria-label="Learning sequence">{labels.map((label,i)=><li key={i} aria-current={step===i?'step':undefined} className={i<step?'visited':i===step?'active':''}><span aria-hidden="true">{i+1}</span><span>{label}</span></li>)}</ol>;
}
