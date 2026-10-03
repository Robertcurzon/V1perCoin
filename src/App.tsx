import { siteUrl, currentPage } from './site';
import { lazy, Suspense, useState } from 'react';
import ExplorerLink from './ExplorerLink';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
import LockPanel from './LockPanel';
import FeastPanel from './FeastPanel';
import LaunchTimeline from './LaunchTimeline';
import { launch, isLaunchConfigured } from './manifest';
import { ArrowDownRight, ArrowUpRight, Github, ShieldCheck, Menu, X } from 'lucide-react';
import { AllocationSection, FreeClaimsSection, BurnsSection, CommunitySection, PrivacySection, QuestionsSection } from './ProjectSections';

const repoUrl = 'https://github.com/Robertcurzon/ViperCoin';


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  if (currentPage() === 'monitor') return <Suspense fallback={<p className="section">Loading onchain monitor…</p>}><Monitor /></Suspense>;
  if (currentPage() === 'whitepaper') return <Suspense fallback={<p className="section">Loading white paper…</p>}><Whitepaper /></Suspense>;
  return <div className="site">
    <a className="skip-link" href="#top">Skip to content</a>
    <header className="header home-header" onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); } }}>
      <a href="#top" className="brand" aria-label="Viper Coin home"><img src={siteUrl('viper-logo.webp')} alt="" /><span>VIPER<span className="accent">.</span><small>COIN / V1PR</small></span></a>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="home-nav" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      <nav id="home-nav" className={menuOpen ? 'is-open' : ''} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
        <a href="#timeline">Timeline</a><a href="#token">Token</a><a href="#feast">The Feast</a><a href="#claims">Free claims</a><a href="#lock">Lock & Earn</a><a href="#privacy">Privacy</a><a href={siteUrl('whitepaper/')}>White paper</a><a href={siteUrl('monitor/')}>Monitor ↗</a>
      </nav>
    </header>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="signal"/> VIPER COIN (V1PR) <span className="dash"/> BUILT ON SUI</div>
          <h1>FEED THE<br/><em>VIPER.</em></h1>
          <p>No more cuddly baby-animal meme coins. Viper eats them for lunch. Cute memes in. More venom out.</p>
          <div className="buttons"><a className="button lime" href="#feast">EXPLORE THE FEAST <ArrowDownRight size={18}/></a><a className="button outline" href="#token">TOKEN STATUS <ArrowUpRight size={18}/></a></div>
        </div>
        <div className="hero-foot"><span>VIPER COIN (V1PR) / 2026</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <div className="launch-strip"><span className="status-label">{isLaunchConfigured ? `SUI ${launch.network.toUpperCase()} CONFIGURED` : 'PRE-LAUNCH / NOT DEPLOYED'}</span><span>Deflationary Supply</span><span>10% free claims</span><span>1–24 month locks</span><a href="#token">VERIFY STATUS ↗</a></div>
      <div className="ticker"><span>MEMES WITH BITE</span><b>✳</b><span>FEED THE VIPER</span><b>✳</b><span>VERIFY THE COIN TYPE</span><b>✳</b><span>BUILT ON SUI</span></div>
      <section id="story" className="section story">
        <div className="kicker">01 / THE STORY</div>
        <div className="two-col"><h2>MEMES<br/><em>WITH BITE.</em></h2><div className="prose"><p>The meme coin jungle has plenty of puppies and kittens. Viper changes the food chain. Babies grow fastest when you feed them — and our baby Viper eats cute, cuddly memes for lunch. More feeding. More venom. More community momentum.</p><p>Viper Coin (V1PR) combines a once-minted, burn-only supply with free community claims and a fully funded lock-reward vault. Lock for 1–24 months; longer commitments earn exponentially higher token rates.</p><a className="text-link" href={repoUrl} target="_blank" rel="noreferrer"><Github size={18}/> EXPLORE THE SOURCE <ArrowUpRight size={16}/></a></div></div>
        <img className="story-art" src={siteUrl('viper-meme-feast.webp')} alt="Illustration of vipers playfully swallowing dog and frog meme mascots in a dark jungle" />
      </section>
      <section id="token" className="token-band"><div className="section token-grid"><div className="coin-image"><img src={siteUrl('viper-logo.webp')} alt="Viper Coin snake logo"/><span>THE VIPER MARK</span></div><div><div className="kicker">02 / TOKEN STATUS</div><h2>TRUST THE<br/><em>ONCHAIN FACTS.</em></h2><p className="token-intro">{isLaunchConfigured ? `Viper Coin (V1PR) deployment records are configured for Sui ${launch.network}. Verify the full coin type below. ${launch.network === 'testnet' ? 'Testnet tokens have no mainnet trading link.' : 'Exchange liquidity is verified separately.'}` : 'The Sui launch is in preparation. No Viper mainnet coin type has been published for this project, so there is no contract address or buy link to display yet.'}</p><div className="facts"><div><span>NETWORK</span><strong>SUI</strong></div><div><span>NAME / TICKER</span><strong>VIPER COIN (V1PR)</strong></div><div><span>{isLaunchConfigured ? `${launch.network.toUpperCase()} COIN TYPE` : 'MAINNET COIN TYPE'}</span><strong className="coin-type">{isLaunchConfigured ? launch.coinType : 'NOT DEPLOYED'}</strong></div><div><span>SUPPLY & DISTRIBUTION</span><strong>1 BILLION · BURN ONLY</strong></div></div><div className="proof-links"><a href={siteUrl('monitor/')}>FOLLOW SUPPLY, REWARDS & WALLET LOCATIONS ↗</a>{isLaunchConfigured && <ExplorerLink kind="coin" value={launch.coinType}>VERIFY V1PR ON SUISCAN</ExplorerLink>}</div><div className="notice"><ShieldCheck size={20}/><span>Only trust a coin type published here and linked to a verifiable Sui transaction. Never send funds to an address from an unsolicited message.</span></div></div></div></section>
      <AllocationSection />
      <LaunchTimeline />
      <FeastPanel />
      <FreeClaimsSection />
      <LockPanel />
      <BurnsSection />
      <CommunitySection />
      <PrivacySection />
      <QuestionsSection />
      <section className="closing"><div className="section closing-grid"><div><div className="kicker">WATCH THE VIPER GROW</div><h2>STAY CLOSE.<br/><em>STAY SHARP.</em></h2></div><a className="button dark" href={siteUrl('monitor/')}>OPEN THE MONITOR <ArrowUpRight size={18}/></a></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} VIPER COIN (V1PR)</span><nav aria-label="Footer navigation"><a href={siteUrl('whitepaper/')}>WHITE PAPER</a><a href="#privacy">PRIVACY</a><a href="#foundation">FOUNDATION</a><a href={repoUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></nav></footer>
  </div>;
}
export default App;
