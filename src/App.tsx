import { siteUrl, currentPage } from './site';
import { lazy, Suspense, useState } from 'react';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
const Rules = lazy(() => import('./Rules')); 
import LockPanel from './LockPanel';
import FeastPanel from './FeastPanel';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AllocationSection, FreeClaimsSection } from './ProjectSections';

const repoUrl = 'https://github.com/Robertcurzon/ViperCoin';
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  if (currentPage() === 'rules') return <Suspense fallback={<p className="section">Loading project rules…</p>}><Rules /></Suspense>;
  if (currentPage() === 'monitor') return <Suspense fallback={<p className="section">Loading onchain monitor…</p>}><Monitor /></Suspense>;
  if (currentPage() === 'whitepaper') return <Suspense fallback={<p className="section">Loading white paper…</p>}><Whitepaper /></Suspense>;
  return <div className="site home-page">
    <a className="skip-link" href="#top">Skip to content</a>
    <header className="header home-header" onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); } }}>
      <a href="#top" className="brand" aria-label="Viper Coin home"><img src={siteUrl('viper-logo.webp')} alt="" /><span>VIPER<span className="accent">.</span><small>COIN / V1PR</small></span></a>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="home-nav" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      <nav id="home-nav" className={menuOpen ? 'is-open' : ''} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
        <a href="#claims">Free bite</a><a href="#feast">Feed the Viper</a><a href="#lock">Lock & Earn</a><a href="#tokenomics">Tokenomics</a><a href={siteUrl('rules/')}>Rules</a><a href={siteUrl('monitor/')}>Monitor</a>
      </nav>
    </header>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow">VIPER COIN (V1PR) · BUILT ON SUI · PRE-LAUNCH</div>
          <h1>MEMES<br/><em>WITH BITE.</em></h1>
          <p>Cute had its turn. Viper Coin is the new top of the Sui meme food chain.</p>
          <div className="buttons"><a className="button lime" href="#den">JOIN THE DEN <ArrowUpRight size={18}/></a><a className="button outline" href="#claims">GET A FREE BITE ↓</a></div>
          <p className="fine-print">Pre-launch: V1PR is not deployed, and nothing on this site promises gains. <a href={siteUrl('rules/#status')}>Full rules →</a></p>
        </div>
        <div className="hero-foot"><span>VIPER COIN / V1PR</span><span>THE JUNGLE HAS A NEW REGULAR ↓</span></div>
      </section>
      <section id="story" className="section story">
        <div className="kicker">01 / THE FOOD CHAIN</div>
        <div className="two-col"><h2>THE FOOD CHAIN<br/><em>JUST CHANGED.</em></h2><div className="prose"><p>The meme jungle is full of puppies and kittens. Viper is the predator. One billion V1PR, minted once, can only shrink.</p><div className="community-strip"><span>Creator grants</span><span>Hunt Board</span><span>Onboarding</span></div><a className="text-link" href={siteUrl('rules/#community')}>Full budget →</a></div></div>
      </section>
      <FreeClaimsSection />
      <FeastPanel />
      <LockPanel />
      <AllocationSection />
      <section id="den" className="closing"><div className="section closing-grid"><div><div className="kicker">THE JUNGLE IS BETTER WITH COMPANY</div><h2>JOIN THE DEN.<br/><em>STAY SHARP.</em></h2></div><div><p>Channels opening soon.</p><a className="button dark" href={repoUrl} target="_blank" rel="noreferrer">FOLLOW ON GITHUB <ArrowUpRight size={18}/></a></div></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} VIPER COIN (V1PR)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href={siteUrl('rules/')}>RULES</a><a href={siteUrl('rules/#foundation')}>FOUNDATION</a><a href={siteUrl('rules/#privacy')}>PRIVACY</a><a href={repoUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>
  </div>;
}
export default App;
