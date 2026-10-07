import { V1per, BrandText } from './V1per';
import { ArrowUpRight, Flame, Fingerprint, Eye } from 'lucide-react';
import { siteUrl } from './site';
import { FEAST_DISCLOSURE } from './feastData';
import FreeClaimApplication from './FreeClaimApplication';
import FreeClaimAction from './FreeClaimAction';
import { launch, isLaunchConfigured } from './manifest';
import ExplorerLink from './ExplorerLink';

const allocations = [
  { name: 'Free claims', percent: 10, color: '#bdf332', description: '100M · approved community wallets' },
  { name: 'Feast claims', percent: 10, color: '#84c942', description: '100M · contributor allocation pool' },
  { name: 'Initial exchange liquidity', percent: 20, color: '#65bfbd', description: '200M · reserve for initial exchange liquidity' },
  { name: 'Later liquidity reserve', percent: 15, color: '#5895be', description: '150M · future exchange depth' },
  { name: 'Community programs', percent: 20, color: '#e6c768', description: '200M · creators, challenges and onboarding' },
  { name: 'Lock rewards', percent: 15, color: '#d79263', description: '150M · reserved lock rewards' },
  { name: 'Ecosystem Operations', percent: 10, color: '#af92c5', description: '100M · V1PER Foundation' },
];

export function AllocationSection() {
  return <section id="tokenomics" className="section allocation">
    <div className="section-heading"><div><div className="kicker">THE INITIAL SUPPLY / 100%</div><h2>EVERY TOKEN.<br/><em>ACCOUNTED FOR.</em></h2></div><p>One billion <V1per /> at launch. No new tokens can be minted. Claims and rewards come from this supply; burns reduce it.</p></div>
    <div className="allocation-bar" aria-hidden="true">{allocations.map(a => <span key={a.name} style={{ width: `${a.percent}%`, background: a.color }} />)}</div>
    <div className="allocation-grid">{allocations.map(a => <article key={a.name}><div><i style={{ background: a.color }} /><span>{a.name}</span><strong>{a.percent}%</strong></div><p><BrandText text={a.description} /></p></article>)}</div>
    <div className="token-proof"><div><span className="kicker">DEFLATIONARY SUPPLY</span><h3>Less supply. Same bite.</h3><p>Burns come from early exits and unused claim inventory.</p><a className="text-link" href={siteUrl('rules/#burns')}>Full rules →</a></div><div><span className="kicker">OFFICIAL SUI TOKEN / {isLaunchConfigured ? launch.network.toUpperCase() : 'PRE-LAUNCH'}</span><p className="coin-type">{isLaunchConfigured ? launch.coinType : 'NOT DEPLOYED'}</p>{isLaunchConfigured && <ExplorerLink kind="coin" value={launch.coinType}>Verify on Suiscan ↗</ExplorerLink>}<a className="text-link" href={siteUrl('monitor/')}>Open the monitor →</a></div></div>
    <p className="fine-print">Liquidity reserves do not prove a funded exchange pool. <a href={siteUrl('rules/#foundation')}>Full rules →</a></p>
  </section>;
}

export function FreeClaimsSection({ detailed = false }: { detailed?: boolean }) {
  return <section id="claims" className="section free-claims-section">
    {detailed ? <><div className="kicker">FREE COMMUNITY CLAIMS</div><h2>HOW THE FREE<br/><em>BITE WORKS.</em></h2></> : <h2>FREE TOKENS.</h2>}
    <p className="token-intro">10,000 <V1per /> per approved wallet. Up to 10,000 wallets. No purchase required; claiming costs Sui network gas.</p>
    <div className="claim-summary"><span className="status-label">{launch.freeClaimsStartMs > 0 ? `SCHEDULED: ${new Date(launch.freeClaimsStartMs).toISOString()}` : 'APPLICATIONS & CLAIMS CLOSED'}</span><a className="text-link" href={detailed ? siteUrl('rules/#claims') : '#free-application'}>How to apply →</a></div>
    <p className="fine-print">Apply in the seven days before opening; approved wallets have 14 days to claim. <a href={siteUrl('rules/#claims')}>Full rules →</a></p>
    {!detailed && <ol className="action-steps"><li>Create an original meme, useful guide or testnet issue report.</li><li>Sign an application with your Sui wallet and submit it for review.</li><li>If approved, return here to claim during the 14-day window.</li></ol>}
    {detailed && <p>Apply with a wallet-signed application and one original community entry. Review checks authorship and repeated entries; approvals freeze at opening. A wallet is not proof of one person. No paid referral or promotional purchase is required. Unclaimed tokens can be burned after expiry; the administrator cannot withdraw them.</p>}
    <div className="claim-actions"><FreeClaimApplication detailed={detailed} /><FreeClaimAction /></div>
    {detailed && <p className="fine-print">The opening must be scheduled and start within 60 days of allocation. If unscheduled at that deadline, anyone may burn the unused pool.</p>}
  </section>;
}

export function BurnsSection() {
  return <section id="burns" className="section feature-section">
    <div className="section-heading"><div><div className="kicker">DEFLATIONARY SUPPLY</div><h2>LESS SUPPLY.<br/><em>SAME BITE.</em></h2></div><p>No subsequent minting. No tax on ordinary transfers or DEX swaps. Every actual burn can be inspected on Sui.</p></div>
    <div className="feature-grid">
      <article className="feature-card"><Flame aria-hidden="true" /><h3>Early exits</h3><p>The fee is 5% of principal × the fraction of the lock remaining, tapering to zero at maturity.</p><div className="split-strip"><span>50% burn</span><span>40% Community</span><span>10% Foundation</span></div><p className="fine-print">Burns queue in the vault. Anyone can flush them; total supply only falls when the tokens are destroyed.</p></article>
      <article className="feature-card"><Eye aria-hidden="true" /><h3>Unused inventory</h3><p>Unclaimed free tokens can be burned after the 14-day window. Feast finalization burns unallocated tokens; remaining claim inventory can be burned after its deadline.</p><a className="text-link" href={siteUrl('monitor/')}>TRACK ACTUAL & PENDING BURNS <ArrowUpRight size={16} /></a></article>
    </div>
    <p className="fine-print">Burning does not guarantee demand, liquidity or price appreciation. Mature lock exits have no project fee.</p>
  </section>;
}

export function CommunitySection() {
  return <section id="community" className="section feature-section community-section">
    <div className="section-heading"><div><div className="kicker">COMMUNITY PROGRAMS / 20% OF SUPPLY</div><h2>BUILD THE<br/><em>FOOD CHAIN.</em></h2></div><p>Make the memes. Welcome the next wallet. Grow the jungle together. Programs are budgeted; award rounds will be announced separately.</p></div>
    <div className="program-grid">{[
      ['6%', 'Creator grants', 'Art, videos, meme packs and community tools.'],
      ['5%', 'Hunt Board', 'Creative challenges and useful contributions.'],
      ['3%', 'Onboarding', 'Wallet education, guides and safety resources.'],
      ['1%', 'Events & moderation', 'Community events and day-to-day support.'],
      ['5%', 'Community reserve', 'Future programs and changing needs.'],
    ].map(([percent, title, text]) => <article key={title}><span>{percent}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    <p className="fine-print">Percentages are of total initial supply. Subbudgets are operating policy, not contract-enforced restrictions. Award recipients, purposes, amounts and transaction receipts should be published. There is no token-holder governance or paid affiliate program in this release.</p>

  </section>;
}

export function FoundationSection() { return <section id="foundation" className="section feature-section"><div className="kicker">FOUNDATION / CUSTODY & LIQUIDITY</div><h2>THE FUNDS.<br/><em>THE CONTROL.</em></h2><div className="rules-prose">
      <p><V1per /> Foundation is the project's operating name for its founder-controlled funds and receiving wallets. It does not imply independent governance or a separate legal entity.</p>
      <p>The 10% Ecosystem Operations allocation pays for development, hosting, design, administration and collaborators at its controller's discretion, without contractual vesting. Community, initial liquidity, later liquidity and Operations use four separate published Sui custody addresses.</p>
      <p><BrandText text={FEAST_DISCLOSURE} /></p>
      <p>25% of Feast proceeds is committed to liquidity; the opening DEX price must be no lower than the Feast clearing price. The opening token deposit is sized to verified paired funding and the pool's price and range; unused tokens stay in the initial reserve. Remaining proceeds are discretionary Foundation funds. Cross-chain conversions and spending are operating commitments, not automatically enforced by the Sui contract. Paired funding, balances, custody and LP-lock terms must be published before trading is announced.</p>
      <a className="text-link" href={siteUrl('monitor/')}>INSPECT THE CUSTODY DIRECTORY <ArrowUpRight size={16} /></a>
    </div></section>; }

export function PrivacySection() {
  return <section id="privacy" className="section feature-section privacy-section">
    <div className="privacy-copy"><div className="kicker">PRIVACY & ACCOUNTABILITY</div><h2>WHAT'S PUBLIC<br/><em>ON-CHAIN.</em></h2><p className="token-intro">Join pseudonymously. No legal name, email or social login is required to read the paper or connect a wallet. Choose what identity information you share.</p><a className="text-link" href={siteUrl('whitepaper/')}>READ THE PRIVACY SECTION <ArrowUpRight size={16} /></a></div>
    <div className="feature-card"><Fingerprint size={36} aria-hidden="true" /><h3>Know what stays visible</h3><p>Sui addresses, transfers, balances, claims and locks remain public. Feast bindings publicly link your source wallet to your Sui destination. Fresh wallets and aliases do not guarantee unlinkability.</p><p><V1per /> has no confidential transfers or shielded balances. Seal and Nautilus are external Sui privacy tools; neither is integrated into this release.</p><p className="fine-print">Wallet, hosting and RPC providers may receive connection metadata. Clearing browser-local charts does not erase blockchain records or provider logs.</p></div>
  </section>;
}

export function QuestionsSection() {
  return <section id="questions" className="section questions-section"><div className="kicker">BEFORE YOUR FIRST BITE</div><h2>KNOW THE<br/><em>RULES.</em></h2><div className="question-list">
    <details className="info-detail"><summary>What happens when lock rewards run out?</summary><div><p>New reward-bearing locks stop when the vault cannot reserve the full term reward. Existing principal and accepted rewards remain escrowed. Unused early-exit reservations return to capacity; anyone can fund the vault with existing <V1per />. There is no inflation or promise of perpetual yield.</p></div></details>
    <details className="info-detail"><summary>Can I leave a lock early?</summary><div><p>Yes. The fee tapers from 5% of principal to zero over your agreed term. Rewards use whole completed 30-day months, at the rate for that completed length; before one month, earned reward is zero. Early exits can return less than deposited. A deposit pause never blocks existing exits. Positions cannot be transferred, extended or topped up.</p></div></details>
    <details className="info-detail"><summary>Where can I buy <V1per />?</summary><div><p>No verified mainnet trading pool is live. The token-status section will publish the complete coin type; the monitor will link the verified exchange pair and Suiscan records when configured. Pool funding, contract review, rehearsal and custody checks must precede participant use. Never use a lookalike ticker as proof of authenticity.</p></div></details>
    <details className="info-detail"><summary>What does the monitor show?</summary><div><p>Supply, actual and pending burns, reward inventory and reservations, locks, claims, fee receipts, Feast allocation and published custody. After verified deployment it refreshes every 30 seconds, retaining up to 720 observations in your browser. This is not a full historical index or circulating-supply estimate. DEX volume covers only the verified configured pair; contribution receipts are from a dated, hash-verified report. Missing and stale data are labeled.</p></div></details>
    <details className="info-detail"><summary>Does “feeding” or locking guarantee gains?</summary><div><p>No. “Venom” means participation and community momentum. Rewards are paid in <V1per />, not guaranteed purchasing power or dollar returns. Market demand, liquidity, Foundation discretion and contract security all affect risk. <V1per /> locks do not earn Sui validator rewards.</p></div></details>
  </div></section>;
}
