import type {ReactNode} from 'react';
import {business} from '@/lib/business';
export function PolicyShell({title,children}:{title:string;children:ReactNode}){return <main className="acquisition policy-page"><nav><a href="/start">Schoolday <strong>OS</strong></a><a href="/support">Help & billing</a></nav><header><span className="eyebrow">NOVAPATH LLC</span><h1>{title}</h1><p>Effective {business.policyDate}</p></header><article>{children}</article></main>}
export function PolicyLinks(){return <footer className="policy-links" aria-label="Policies and support"><a href="/privacy">Privacy policy</a><a href="/terms">Subscription terms</a><a href="/support">Support</a><a href="/family-privacy">Privacy controls</a></footer>}

export function BusinessContact(){return <address style={{fontStyle:'normal',margin:'1rem 0'}}><strong>{business.name}</strong><br/>{business.address}<br/><a href={business.phoneHref}>{business.phone}</a><br/><a href={'mailto:'+business.supportEmail}>{business.supportEmail}</a></address>}
