import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { V1per } from './V1per';
import { currentPage, siteUrl, site } from './site';
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const page = typeof window === 'undefined' ? '' : currentPage();
  return <header className="header home-header shared-header" onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); } }}>
    <a href={siteUrl('')} className="brand" aria-label="V1PER Coin home"><img src={siteUrl('viper-logo.webp')} alt=""/><span><V1per /><span className="accent">.</span><small>COIN / <V1per /></small></span></a>
    <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={24}/> : <Menu size={24}/>}</button>
    <nav id="site-nav" className={open ? 'is-open' : ''} aria-label="Main navigation" onClick={() => setOpen(false)}>{[['free-tokens','Free tokens'],['feast','The Feast'],['lock','Lock & Earn'],['community','Community'],['tokenomics','Supply'],['whitepaper','White paper'],['rules','Rules'],['monitor','Monitor']].map(([route,label]) => <a key={route} href={siteUrl(`${route}/`)} aria-current={page === route ? 'page' : undefined}>{label}</a>)}</nav>
    <div className="header-wallet"><ConnectButton/></div>
  </header>;
}
export function BackHomeLink() { return <a className="text-link back-home" href={siteUrl('')}>← Back to home</a>; }
export function SiteFooter() { return <footer><span>© {new Date().getFullYear()} <V1per /> Coin (<V1per />)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href={siteUrl('rules/')}>RULES</a><a href={siteUrl('rules/#foundation')}>FOUNDATION</a><a href={siteUrl('rules/#privacy')}>PRIVACY</a><a href={site.repository} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>; }
