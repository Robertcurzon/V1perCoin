import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { V1per } from './V1per';
import { currentPage, siteUrl, site } from './site';
export default function SiteHeader() {
  const page = typeof window === 'undefined' ? '' : currentPage();
  return <header className="header home-header shared-header">
    <a href={siteUrl('')} className="brand" aria-label="V1PER TOKEN ON SUI home"><img src={siteUrl('v1per-emblem.webp')} alt=""/><span><V1per /><small>TOKEN ON SUI</small></span></a>
    <nav id="site-nav" aria-label="Main navigation">{[['free-tokens','Free tokens'],['feast','The Feast'],['lock','Lock & Earn'],['community','Community'],['tokenomics','Supply'],['whitepaper','White paper'],['rules','Rules'],['monitor','Monitor']].map(([route,label]) => <a key={route} href={siteUrl(`${route}/`)} aria-current={page === route ? 'page' : undefined}>{label}</a>)}</nav>
    <div className="header-wallet"><ConnectButton/></div>
  </header>;
}
export function BackHomeLink() { return <a className="text-link back-home" href={siteUrl('')}>← Back to home</a>; }
export function SiteFooter() { return <footer><span>© {new Date().getFullYear()} <V1per /> Coin (<V1per />)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href={siteUrl('rules/')}>RULES</a><a href={siteUrl('rules/#foundation')}>FOUNDATION</a><a href={siteUrl('rules/#privacy')}>PRIVACY</a><a href={site.repository} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>; }
