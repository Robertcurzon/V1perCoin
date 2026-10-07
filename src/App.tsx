import { V1per } from './V1per';
import { siteUrl, currentPage } from './site';
import { lazy, Suspense } from 'react';
import SiteHeader, { SiteFooter } from './SiteHeader';
import type { ParticipationRoute } from './ParticipationPage';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { launch, isLaunchConfigured } from './manifest';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
const Rules = lazy(() => import('./Rules'));
const ParticipationPage = lazy(() => import('./ParticipationPage'));
function App() {
  const page = currentPage();
  if (['free-tokens','feast','lock','community','tokenomics'].includes(page)) return <Suspense fallback={<p className="section">Loading…</p>}><ParticipationPage page={page as ParticipationRoute}/></Suspense>;
  if (currentPage() === 'rules') return <Suspense fallback={<p className="section">Loading project rules…</p>}><Rules /></Suspense>;
  if (currentPage() === 'monitor') return <Suspense fallback={<p className="section">Loading onchain monitor…</p>}><Monitor /></Suspense>;
  if (currentPage() === 'whitepaper') return <Suspense fallback={<p className="section">Loading white paper…</p>}><Whitepaper /></Suspense>;
  return <div className="site home-page">
    <a className="skip-link" href="#top">Skip to content</a>
    <SiteHeader/>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow"><span><V1per /> COIN (<V1per />) · BUILT ON SUI · PRE-LAUNCH</span></div>
          <h1>MEMES<br/><em>WITH BITE.</em></h1>
          <p>Cute had its turn.<br/><V1per /> Coin bites back.<br/>A deflationary meme coin on Sui.</p>
          <div className="buttons"><a className="button lime" href="#ways-in">GET STARTED ↓</a><a className="button outline" href={siteUrl('community/')}>COMMUNITY →</a></div>
          <p className="fine-print">{isLaunchConfigured ? `Sui ${launch.network}. Check each participation page for opening dates.` : 'Not launched yet. Applications, contributions and token transactions are closed.'} <a href={siteUrl('rules/#status')}>Launch status →</a></p>
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
          <article className="entry-card free-entry"><h3>FREE TOKENS</h3><p>Submit an original meme, guide or testnet issue report. Approved wallets can claim 10,000 <V1per /> once.</p><span className="status-label">{launch.freeClaimsStartMs > 0 ? 'OPENING DATE SET' : 'APPLICATIONS & CLAIMS CLOSED'}</span><a className="text-link" href={siteUrl('free-tokens/')}>Apply or claim →</a></article>
          <article className="entry-card"><h3>THE FEAST</h3><p>Contribute accepted meme coins for a <V1per /> allocation. Claim in stages or choose a 12- or 24-month lock.</p><span className="status-label">{launch.feastOpen && isLaunchConfigured ? 'CHECK THE CONTRIBUTION WINDOW' : 'CONTRIBUTIONS CLOSED'}</span><a className="text-link" href={siteUrl('feast/')}>View coins and participate →</a></article>
          <article className="entry-card"><h3>LOCK & EARN</h3><p>Lock tokens for 1–24 months. Longer terms earn higher funded token rewards.</p><a className="text-link" href={siteUrl('lock/')}>Calculate rewards →</a></article>
          <article className="entry-card"><h3>COMMUNITY</h3><p>Find official social channels and community programs. X, Telegram and Discord are coming soon.</p><a className="text-link" href={siteUrl('community/')}>Join the community →</a></article>
          <article className="entry-card"><h3>DEFLATIONARY SUPPLY</h3><p>See the one-billion-token allocation and how burns reduce supply.</p><a className="text-link" href={siteUrl('tokenomics/')}>Explore the supply →</a></article>
          <article className="entry-card"><h3>VERIFY THE PROJECT</h3><p>Read the rules and white paper. Track verified token activity in the monitor after deployment.</p><a className="text-link" href={siteUrl('rules/')}>Read the rules →</a><a className="text-link" href={siteUrl('monitor/')}>Open the monitor →</a></article>
        </div>
      </section>
    </main>
    <SiteFooter/>
  </div>;
}
export default App;
