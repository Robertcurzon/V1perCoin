import { V1per } from './V1per';
import { siteUrl, currentPage, site } from './site';
import { CommunityLinks, JoinDenButton } from './CommunityLinks';
import { lazy, Suspense, useState } from 'react';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
const Rules = lazy(() => import('./Rules')); 
import LockPanel from './LockPanel';
import FeastPanel from './FeastPanel';
import { Menu, X } from 'lucide-react';
import { launch } from './manifest';
import { AllocationSection, FreeClaimsSection } from './ProjectSections';

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
        <a href="#claims">Free bite</a><a href="#feast">Feed the Viper</a><a href="#lock">Lock & Earn</a><a href="#tokenomics">Tokenomics</a><a href={siteUrl('rules/')}>Rules</a><a href={siteUrl('monitor/')}>Monitor</a>
      </nav><JoinDenButton className="button lime header-join" />
    </header>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow"><V1per /> Coin (<V1per />) · BUILT ON SUI · PRE-LAUNCH</div>
          <h1>MEMES<br/><em>WITH BITE.</em></h1>
          <p>Cute had its turn.<br/><V1per /> Coin bites back.</p>
          <div className="buttons"><JoinDenButton /></div>
          <p className="fine-print">Pre-launch: <V1per /> is not deployed, and nothing on this site promises gains. <a href={siteUrl('rules/#status')}>Full rules →</a></p>
        </div>
        <div className="hero-foot"><span><V1per /> Coin / <V1per /></span><span>THE JUNGLE HAS A NEW REGULAR ↓</span></div>
      </section>
      <section id="ways-in" className="section ways-in" aria-labelledby="ways-heading">
        <div className="kicker" id="ways-heading">TWO WAYS IN</div>
        <div className="entry-grid">
          <article className="entry-card free-entry"><h2>FIRST BITE'S<br/><em>FREE.</em></h2><p>10,000 <V1per /> per approved wallet.</p><span className="status-label">{launch.freeClaimsStartMs > 0 ? 'WINDOW SCHEDULED' : 'APPLICATIONS & CLAIMS CLOSED'}</span><a className="text-link" href="#claims">How it works ↓</a></article>
          <article className="entry-card feast-entry"><div><h2>FEED THE<br/><em>VIPER.</em></h2><p>1.00× / 1.10× / 1.25× allocation points</p><a className="text-link" href="#feast">See the menu ↓</a></div><div className="menu-preview" aria-label="Feast menu: SHIB, PEPE, SPX, FLOKI, PUMP, PENGU, BONK, WIF, DOGE, M"><span>ON THE MENU</span><p>SHIB · PEPE · SPX · FLOKI<br/>PUMP · PENGU · BONK · WIF<br/>DOGE · M</p></div></article>
        </div>
      </section>
      <section id="story" className="section story">
        <div className="kicker">01 / THE FOOD CHAIN</div>
        <div className="two-col"><h2>THE FOOD CHAIN<br/><em>JUST CHANGED.</em></h2><div className="prose"><p>The meme jungle is full of puppies and kittens. Viper is the predator. One billion <V1per />, minted once, can only shrink.</p><div className="community-strip"><span>Creator grants</span><span>Hunt Board</span><span>Onboarding</span></div><a className="text-link" href={siteUrl('rules/#community')}>Full budget →</a></div></div>
      </section>
      <FreeClaimsSection />
      <FeastPanel />
      <LockPanel />
      <AllocationSection />
      <section id="den" className="closing"><div className="section closing-grid"><div><div className="kicker">THE JUNGLE IS BETTER WITH COMPANY</div><h2>JOIN THE DEN.<br/><em>STAY SHARP.</em></h2></div><CommunityLinks dark /></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} <V1per /> Coin (<V1per />)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href={siteUrl('rules/')}>RULES</a><a href={siteUrl('rules/#foundation')}>FOUNDATION</a><a href={siteUrl('rules/#privacy')}>PRIVACY</a><a href={repoUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>
  </div>;
}
export default App;
