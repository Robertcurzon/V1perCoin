import { useEffect } from 'react';
import { V1per, BrandText } from './V1per';
import { siteUrl } from './site';
import SiteHeader, { BackHomeLink, SiteFooter } from './SiteHeader';
import { launch, isLaunchConfigured } from './manifest';

const phases = [
  ['Day −7 → 0', 'Apply', 'Submit an original community entry and signed application. Up to 10,000 wallets are approved.'],
  ['Day 0 → 14', 'Free claims', 'Approved wallets claim once. The Feast opens; funded locks become available when unpaused.'],
  ['Day 14 → 21', 'Feast only', 'Free claims close permanently. Feast contributions continue until day 21.'],
  ['Day 21 → 23', 'Link wallets', 'Contributions close. Finish source-wallet proofs and Sui allocation choices by day 23.'],
  ['Day 23 → at least 30', 'Review', 'Evidence and allocations are published. A complete upload starts a seven-day onchain review.'],
  ['Finalization → +90 days', 'Claim allocations', 'Contributors claim. Trading opens separately, only after verified pool funding and LP custody.'],
];
export default function Rules() {
  useEffect(() => {
    const reveal = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target instanceof HTMLDetailsElement) { target.open = true; target.scrollIntoView(); }
    };
    reveal(); window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);
  const t = isLaunchConfigured && launch.freeClaimsStartMs > 0 ? launch.freeClaimsStartMs : null;
  return <div className="site rules-page with-site-header"><a className="skip-link" href="#status">Skip to rules</a><SiteHeader/>
    <main className="section concise-rules"><BackHomeLink/>
      <section id="status" className="rules-intro"><div className="kicker">RULES & PUBLIC PROOF</div><h1>KNOW THE<br/><em>RULES.</em></h1>
        <p><BrandText text={isLaunchConfigured ? `Sui ${launch.network} deployment records are configured. Verify the full coin type in the monitor; testnet is not a mainnet launch.` : 'V1PER is not deployed. Applications, contributions and claims are closed. No verified mainnet coin type or funded trading pool is live.'}/></p>
        <p>Use the full verified Sui coin type, never the ticker alone. Rewards are tokens; gains and purchasing power are not guaranteed.</p>
        <a className="text-link" href={siteUrl('monitor/')}>Verify in the monitor →</a><a className="text-link" href={siteUrl('whitepaper/')}>Full white paper →</a>
      </section>
      <section id="timeline" className="compact-timeline"><h2>LAUNCH TIMELINE.</h2><p>{t ? `Day 0: ${new Date(t).toISOString()}.` : 'Opening date not announced.'} Day 0 opens free claims and the Feast. All deadlines use UTC; closing timestamps are exclusive.</p>
        <ol>{phases.map(([when,title,description]) => <li key={title}><span>{when}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        <p className="fine-print">Delays postpone finalization, never reopen free claims. Every allocation edit restarts review. No trading date is promised.</p>
      </section>
      <section className="compact-terms" aria-label="Participation terms">
        <details id="claims" className="info-detail"><summary>Free tokens: eligibility and limits</summary><div>
          <p>10% of supply: 100 million tokens. Up to 10,000 approved wallets claim 10,000 <V1per/> once. Apply during the seven days before opening with an original meme, useful guide or valid testnet report. No purchase; claims cost Sui gas.</p>
          <p>Manual review checks original work and repeated entries; eligibility freezes at opening. A wallet is not proof of one person. The 14-day claim window cannot reopen. Anyone may burn unclaimed inventory after expiry. Opening must start within 60 days of allocation or unused inventory becomes burnable.</p>
          <a className="text-link" href={siteUrl('free-tokens/')}>Apply or claim →</a>
        </div></details>
        <details id="feast" className="info-detail"><summary>The Feast: contributions and allocations</summary><div>
          <p>The 21-day contribution window accepts only the published coins and networks. Source-signed proofs and Sui-signed allocation choices are due by day 23. Wallet bindings publicly link source and destination addresses.</p>
          <p>100 million tokens fund allocations at 10,000 <V1per/> per eligible USD before bonuses. No wallet cap. Prices use the lower of the verified Pyth spot price and the 1,440 one-minute average. Oversubscription scales allocations proportionally; submission does not guarantee acceptance.</p>
          <p>Liquid choice: 50% at finalization, the rest over 60 days. A 12-month lock adds a 10% allocation bonus; 24 months adds 25%. Locked rewards must be fully funded at finalization. Locks start when claimed. Claim within 90 days of finalization; unused inventory becomes burnable. An unfinalized Feast expires after 120 days.</p>
          <p>Contributions go to founder-controlled Foundation wallets, with no contribution refund path. 25% of gross Feast proceeds is committed to liquidity; the remainder is discretionary Foundation funding. Conversion and spending are operating commitments, not enforced automatically by Sui.</p>
          <a className="text-link" href={siteUrl('feast/')}>Accepted coins and participation →</a>
        </div></details>
        <details id="lock" className="info-detail"><summary>Locks: funded rewards and early exits</summary><div>
          <p>Choose 1–24 months; one month = 30 days. Annual simple token rates rise exponentially from 1% to 10%. Total reward = annual rate × months / 12, reaching 20% at 24 months. No compounding, deposit fee or maturity fee.</p>
          <p>The 150 million reward pool reserves each accepted lock’s full reward. First come, first served: new locks stop when capacity is insufficient. Existing principal and accepted rewards stay escrowed. Anyone can replenish rewards with existing tokens; no new minting or perpetual yield.</p>
          <p>Early-exit fee = 5% of principal × the fraction of the term remaining. Split: 50% queued for burning, 40% Community programs, 10% Foundation. Rewards use whole completed 30-day months at the rate for that completed length; before one month, zero reward. Early exits can return less than deposited.</p>
          <p>A deposit pause never blocks exits. Positions cannot be transferred, extended or topped up. Unused reward reservations return to capacity.</p>
          <a className="text-link" href={siteUrl('lock/')}>Calculate rewards or manage locks →</a>
        </div></details>
        <details id="burns" className="info-detail"><summary>Deflationary supply and burns</summary><div>
          <p>One billion tokens are minted once; no subsequent minting. Ordinary transfers and DEX swaps have no project tax. Burns come from early-exit fees and unused free/Feast inventory. Finalization burns unallocated Feast tokens.</p>
          <p>Queued tokens are not yet burned. Anyone can flush exit burns; total supply falls only when tokens are destroyed onchain. Burning does not guarantee price appreciation.</p><a className="text-link" href={siteUrl('tokenomics/')}>View allocations →</a>
        </div></details>
        <details id="community" className="info-detail"><summary>Community programs</summary><div>
          <p>20% of supply funds creators (6%), challenges (5%), onboarding (3%), events and moderation (1%), and a community reserve (5%). These are operating budgets, not contract-enforced restrictions. Award rounds are announced separately; recipients, amounts and receipts should be published. No token-holder governance or paid affiliate program in this release.</p><a className="text-link" href={siteUrl('community/')}>Community and programs →</a>
        </div></details>
        <details id="foundation" className="info-detail"><summary>Foundation control and exchange liquidity</summary><div>
          <p><V1per/> Foundation is the operating name for founder-controlled funds and wallets; it does not imply independent governance or a separate legal entity. The 10% Ecosystem Operations allocation is discretionary, without contractual vesting. Community, Operations and the two liquidity reserves use separate published Sui addresses.</p>
          <p>20% of supply is reserved for initial liquidity, 15% for later liquidity. Token reserves do not supply the paired SUI or other asset. Opening deposits depend on verified paired funding, price and pool range; unused tokens stay in reserve. The opening DEX price must be no lower than the Feast clearing price. Publish funding, custody and LP-lock terms before announcing trading.</p>
        </div></details>
        <details id="privacy" className="info-detail"><summary>Privacy: what remains public</summary><div>
          <p>Participation can be pseudonymous; no legal name, email or social login is required to read or connect a wallet. Sui addresses, transfers, balances, claims and locks remain public. Feast proofs link wallets; aliases and fresh addresses do not guarantee unlinkability.</p>
          <p>No shielded balances or confidential transfers. Seal and Nautilus are external tools, not integrated into this release. Wallet, hosting and RPC providers may receive connection metadata. Clearing local charts does not erase blockchain records or provider logs.</p>
        </div></details>
        <details id="questions" className="info-detail"><summary>Buying and monitoring</summary><div>
          <p>Buy only through a verified funded pool linked in the monitor after launch. The monitor refreshes every 30 seconds and stores up to 720 observations locally. It is not a full historical index or circulating-supply estimate. Volume covers the configured pair; Feast receipts use a dated, hash-verified report. Missing and stale data are labeled.</p>
        </div></details>
      </section>
    </main><SiteFooter/>
  </div>;
}
