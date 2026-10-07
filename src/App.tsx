import { V1per } from './V1per';
import { siteUrl, currentPage, site } from './site';
import { CommunityLinks } from './CommunityLinks';
import { lazy, Suspense, useState } from 'react';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
const Rules = lazy(() => import('./Rules')); 
import LockPanel from './LockPanel';
import FeastPanel from './FeastPanel';
import { Menu, X } from 'lucide-react';
import { launch } from './manifest';
import { AllocationSection, FreeClaimsSection } from './ProjectSections';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { isLaunchConfigured } from './manifest';

const repoUrl = site.repository;
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  if (currentPage() === 'rules') return <Suspense fallback={<p className="section">Loading project rules…</p>}><Rules /></Suspense>;
  if (currentPage() === 'monitor') return <Suspense fallback={<p className="section">Loading onchain monitor…</p>}><Monitor /></Suspense>;
  if (currentPage() === 'whitepaper') return <Suspense fallback={<p className="section">Loading white paper…</p>}><Whitepaper /></Suspense>;
  return <div className="site home-page">
    <a className="skip-link" href="#top">Skip to content</a>
    <header className="header home-header" onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); } }}>
      <a href="#top" className="brand" aria-label="V1PER Coin home"><img src={siteUrl('viper-logo.webp')} alt="" /><span><V1per /><span className="accent">.</span><small>COIN / <V1per /></small></span></a>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="home-nav" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      <nav id="home-nav" className={menuOpen ? 'is-open' : ''} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
        <a href="#claims">Free tokens</a><a href="#feast">The Feast</a><a href="#lock">Lock & Earn</a><a href="#den">Community</a><a href={siteUrl('rules/')}>Rules</a><a href={siteUrl('monitor/')}>Monitor</a>
      </nav><div className="header-wallet"><ConnectButton /></div>
    </header>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow"><span><V1per /> COIN (<V1per />) · BUILT ON SUI · PRE-LAUNCH</span></div>
          <h1>MEMES<br/><em>WITH BITE.</em></h1>
          <p>Cute had its turn.<br/><V1per /> Coin bites back.<br/>A deflationary meme coin on Sui.</p>
          <div className="buttons"><a className="button lime" href="#ways-in">GET STARTED ↓</a><a className="button outline" href="#den">COMMUNITY ↓</a></div>
          <p className="fine-print">{isLaunchConfigured ? `Sui ${launch.network}. Check each action’s opening dates below.` : 'Not launched yet. Applications, contributions and token transactions are closed.'} <a href={siteUrl('rules/#status')}>Launch status →</a></p>
        </div>
        <div className="hero-foot"><span><V1per /> COIN</span><span>FREE TOKENS · THE FEAST · LOCK REWARDS ↓</span></div>
      </section>
      <aside id="story" className="identity-note section" aria-labelledby="identity-heading">
        <h2 id="identity-heading">NOT TO BE<br/>MISTAKEN.</h2>
        <div><p><V1per /> Coin (<V1per />) is independent, built on Sui, and unaffiliated with other projects using $VIPER.</p><p className="identity-standard">Quality. Ferocity. No BS.</p></div>
        <a className="text-link" href={siteUrl('rules/#status')}>VERIFY THIS PROJECT →</a>
      </aside>
      <section id="ways-in" className="section ways-in" aria-labelledby="ways-heading">
        <h2 id="ways-heading">GET STARTED.</h2>
        <div className="wallet-start" id="wallet"><div><h3>Connect your Sui wallet</h3><p>Your wallet is used for free claims, Feast allocations and locks. Connecting does not send tokens.</p></div><ConnectButton /></div>
        <div className="entry-grid">
          <article className="entry-card free-entry"><h3>FREE TOKENS</h3><p>Submit an original meme, guide or testnet issue report. Approved wallets can claim 10,000 <V1per /> once.</p><span className="status-label">{launch.freeClaimsStartMs > 0 ? 'OPENING DATE SET' : 'APPLICATIONS & CLAIMS CLOSED'}</span><a className="text-link" href="#claims">Apply or claim ↓</a></article>
          <article className="entry-card"><h3>THE FEAST</h3><p>Contribute accepted meme coins for a <V1per /> allocation. Claim in stages or choose a 12- or 24-month lock.</p><span className="status-label">{launch.feastOpen && isLaunchConfigured ? 'CHECK THE CONTRIBUTION WINDOW' : 'CONTRIBUTIONS CLOSED'}</span><a className="text-link" href="#feast">View coins and participate ↓</a></article>
        </div>
      </section>
      <FreeClaimsSection />
      <FeastPanel />
      <LockPanel />
      <AllocationSection />
      <section id="den" className="closing"><div className="section closing-grid"><div><h2>JOIN THE<br/><em>COMMUNITY.</em></h2><p>Follow launch updates, share memes and meet the community.</p></div><CommunityLinks dark /></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} <V1per /> Coin (<V1per />)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href={siteUrl('rules/')}>RULES</a><a href={siteUrl('rules/#foundation')}>FOUNDATION</a><a href={siteUrl('rules/#privacy')}>PRIVACY</a><a href={repoUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>
  </div>;
}
export default App;
