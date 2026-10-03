import { siteUrl, currentPage } from './site';
import { lazy, Suspense } from 'react';
import ExplorerLink from './ExplorerLink';
const Monitor = lazy(() => import('./Monitor'));
const Whitepaper = lazy(() => import('./Whitepaper'));
import LockPanel from './LockPanel';
import { launch, isLaunchConfigured } from './manifest';
import { ArrowDownRight, ArrowUpRight, Github, ShieldCheck } from 'lucide-react';

const repoUrl = 'https://github.com/Robertcurzon/ViperCoin';
const phases = [
  ['01', 'Build', 'Deflationary supply, allocation, approved claims, and funded lock rewards in Move.', 'IMPLEMENTED'],
  ['02', 'Rehearse', 'Run the wallet and contract flows on Sui testnet and publish transaction records.', 'NEXT'],
  ['03', 'Verify', 'Review custody, contract security, metadata, and exchange liquidity funding.', 'REQUIRED'],
  ['04', 'Launch', 'Publish the verified mainnet coin type, open claims, and fund the exchange pool.', 'NOT LIVE'],
];

function App() {
  if (currentPage() === 'monitor') return <Suspense fallback={<p className="section">Loading onchain monitor…</p>}><Monitor /></Suspense>;
  if (currentPage() === 'whitepaper') return <Suspense fallback={<p className="section">Loading white paper…</p>}><Whitepaper /></Suspense>;
  return <div className="site">
    <header className="header">
      <a href="#top" className="brand" aria-label="Viper Coin home"><img src={siteUrl('viper-logo.webp')} alt="" /><span>VIPER<span className="accent">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#story">Story</a><a href="#token">Token</a><a href="#lock">Lock & Earn</a><a href={siteUrl('whitepaper/')}>White paper</a><a href={siteUrl('monitor/')}>Monitor</a><a href="#roadmap">Launch</a></nav>
      <a className="header-cta" href={repoUrl} target="_blank" rel="noreferrer">VIEW THE BUILD <ArrowUpRight size={16}/></a>
    </header>
    <main id="top">
      <section className="hero">
        <img className="hero-image" src={siteUrl('viper-art.jpg')} alt="" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="signal"/> THE VIPER IS COMING <span className="dash"/> SUI FIRST</div>
          <h1>THE HUNT<br/><em>BEGINS.</em></h1>
          <p>No more cuddly baby-animal meme coins. Viper eats them for lunch. A new Sui meme coin with fangs out.</p>
          <div className="buttons"><a className="button lime" href="#roadmap">EXPLORE THE PLAN <ArrowDownRight size={18}/></a><a className="button outline" href="#token">TOKEN STATUS <ArrowUpRight size={18}/></a></div>
        </div>
        <div className="hero-foot"><span>VIPER COIN (V1PR) / 2026</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <div className="ticker"><span>MEMES WITH BITE</span><b>✳</b><span>CUTE COINS? LUNCH.</span><b>✳</b><span>VERIFY THE COIN TYPE</span><b>✳</b><span>BUILT ON SUI</span></div>
      <section id="story" className="section story">
        <div className="kicker">01 / THE STORY</div>
        <div className="two-col"><h2>MEMES<br/><em>WITH BITE.</em></h2><div className="prose"><p>The meme coin jungle has plenty of puppies and kittens. Viper is here to change the food chain: a bold snake, a wicked sense of humor, and a Sui launch you can check for yourself.</p><p>Viper Coin (V1PR) combines a once-minted, burn-only supply with free community claims and a fully funded lock-reward vault. Lock for 1–24 months; longer commitments earn exponentially higher token rates.</p><a className="text-link" href={repoUrl} target="_blank" rel="noreferrer"><Github size={18}/> EXPLORE THE SOURCE <ArrowUpRight size={16}/></a></div></div>
        <img className="story-art" src={siteUrl('viper-meme-feast.webp')} alt="Illustration of vipers playfully swallowing dog and frog meme mascots in a dark jungle" />
      </section>
      <section id="token" className="token-band"><div className="section token-grid"><div className="coin-image"><img src={siteUrl('viper-logo.webp')} alt="Viper Coin snake logo"/><span>THE VIPER MARK</span></div><div><div className="kicker">02 / TOKEN STATUS</div><h2>TRUST THE<br/><em>ONCHAIN FACTS.</em></h2><p className="token-intro">{isLaunchConfigured ? `Viper Coin (V1PR) deployment records are configured for Sui ${launch.network}. Verify the full coin type below. ${launch.network === 'testnet' ? 'Testnet tokens have no mainnet trading link.' : 'Exchange liquidity is verified separately.'}` : 'The Sui launch is in preparation. No Viper mainnet coin type has been published for this project, so there is no contract address or buy link to display yet.'}</p><div className="facts"><div><span>NETWORK</span><strong>SUI</strong></div><div><span>NAME / TICKER</span><strong>VIPER COIN (V1PR)</strong></div><div><span>{isLaunchConfigured ? `${launch.network.toUpperCase()} COIN TYPE` : 'MAINNET COIN TYPE'}</span><strong className="coin-type">{isLaunchConfigured ? launch.coinType : 'NOT DEPLOYED'}</strong></div><div><span>SUPPLY & DISTRIBUTION</span><strong>1 BILLION · BURN ONLY</strong></div></div><div className="proof-links"><a href={siteUrl('monitor/')}>FOLLOW SUPPLY, REWARDS & WALLET LOCATIONS ↗</a>{isLaunchConfigured && <ExplorerLink kind="coin" value={launch.coinType}>VERIFY V1PR ON SUISCAN</ExplorerLink>}</div><div className="notice"><ShieldCheck size={20}/><span>Only trust a coin type published here and linked to a verifiable Sui transaction. Never send funds to an address from an unsolicited message.</span></div></div></div></section>
      <section className="section allocation"><div className="kicker">THE INITIAL SUPPLY / 100%</div><h2>EVERY TOKEN.<br/><em>ACCOUNTED FOR.</em></h2><div className="allocation-grid">{[['Free claims',10],['Public distribution reserve',10],['Initial exchange liquidity',20],['Later liquidity reserve',15],['Community programs',20],['Lock rewards',15],['Ecosystem Operations',10]].map(([name,percent])=><div key={name}><span>{name}</span><strong>{percent}%</strong></div>)}</div><p className="fine-print">Operations is founder-controlled. Liquidity allocations are token reserves; they do not mean a funded exchange pool exists. No paid contribution campaign is open.</p></section>
      <LockPanel />
      <section id="roadmap" className="section roadmap"><div className="kicker">04 / THE LAUNCH</div><div className="roadmap-head"><h2>MOVE WITH<br/><em>INTENT.</em></h2><p>A launch is a sequence of proof, not a date on a poster. Each stage has something the community can inspect.</p></div><div className="phases">{phases.map(([n,title,description,state])=><article key={n}><div className="phase-top"><span>{n}</span><small className={state === 'IN PROGRESS' ? 'active' : ''}>{state}</small></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section className="closing"><div className="section closing-grid"><div><div className="kicker">THE PIT IS OPENING</div><h2>STAY CLOSE.<br/><em>STAY SHARP.</em></h2></div><a className="button dark" href={repoUrl} target="_blank" rel="noreferrer">FOLLOW THE BUILD <ArrowUpRight size={18}/></a></div></section>
    </main>
    <footer><span>© {new Date().getFullYear()} VIPER COIN (V1PR)</span><span>MEMES WITH BITE · SUI FIRST</span><a href={repoUrl} target="_blank" rel="noreferrer">GITHUB ↗</a></footer>
  </div>;
}
export default App;
