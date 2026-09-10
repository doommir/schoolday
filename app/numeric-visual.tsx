import type {Stage} from '@/lib/types';
export function NumericVisual({visual}:{visual:Stage['visual']}) {
 if(!visual||visual.kind==='none')return null;
 const v=visual.values;
 if(!Array.isArray(v)||!v.length||v.some(n=>!Number.isFinite(n)))return null;
 const fraction=visual.kind==='fraction';
 if(fraction&&(v.length!==2||!Number.isInteger(v[0])||!Number.isInteger(v[1])||v[1]<1||v[1]>64||v[0]<0||v[0]>v[1]))return null;
 if(visual.kind==='numberline'&&(v.length!==3||v[1]<=v[0]||v[2]<v[0]||v[2]>v[1]))return null;
 if(visual.kind==='bar'&&(v.length>16||visual.labels.length!==v.length))return null;
 const min=Math.min(0,...v),max=Math.max(0,...v),range=max-min||1,zero=100*(0-min)/range;
 return <figure className="numeric-visual learning-diagram"><span className="diagram-label">{fraction?'Equal parts':visual.kind==='numberline'?'Position on a number line':'Compare the quantities'}</span>
 {fraction&&<><div className="fraction-strip" role="img" aria-label={`${v[0]} of ${v[1]} equal parts shaded`} style={{display:'grid',gridTemplateColumns:`repeat(${v[1]}, minmax(0, 1fr))`}}>{Array.from({length:v[1]},(_,i)=><span key={i} className={i<v[0]?'filled':''}/>)}</div><p className="diagram-equation"><strong>{v[0]} / {v[1]}</strong><span>{v[0]} shaded · {v[1]} equal parts in one whole</span></p></>}
 {visual.kind==='numberline'&&<><div className="precise-numberline" role="img" aria-label={`${v[2]} on a number line from ${v[0]} to ${v[1]}`}><div className="numberline-track"><b style={{left:`${100*(v[2]-v[0])/(v[1]-v[0])}%`}}><span>{v[2]}</span></b></div><div className="axis-ends"><span>{v[0]}</span><span>{v[1]}</span></div></div><p className="diagram-note">The marker shows {v[2]}.</p></>}
 {visual.kind==='bar'&&<><div className="quantity-chart">{v.map((n,i)=><div className="quantity-row" key={i}><span>{visual.labels[i]}</span><div className="quantity-track" aria-hidden="true"><i style={{left:`${zero}%`}}/><b style={{left:`${100*(Math.min(0,n)-min)/range}%`,width:`${100*Math.abs(n)/range}%`}}/></div><strong>{n}</strong></div>)}</div><p className="diagram-note">Each bar uses the same scale. The vertical line marks zero.</p></>}
 <figcaption>{visual.caption}</figcaption></figure>;
}
