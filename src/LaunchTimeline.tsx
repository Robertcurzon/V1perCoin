import { launch, isLaunchConfigured } from './manifest';
import { siteUrl } from './site';
const phases = [
  ['Before scheduling', 'Prepare & verify', 'Everyone can read the paper, inspect code and follow the monitor. No contributions or free claims. Complete review, rehearsal, receiving-wallet and liquidity-funding checks.'],
  ['Day −7 → day 0', 'Apply for a free claim', 'Community applicants submit a signed Sui-wallet application and an original meme, guide or valid testnet report through the published channel. Reviews admit up to 10,000 addresses; no payment is required.'],
  ['Day 0 → day 14', 'Free claims open', 'Approved addresses can claim 10,000 V1PR once. The eligibility list freezes at opening. The Feast is open; V1PR holders can open funded locks when the vault is unpaused; no official trading pool is promised yet.'],
  ['Day 14 → day 21', 'Feast only', 'Free claims are closed permanently; anyone can trigger burning of the pool’s unclaimed inventory. Bound contributors can still feed the Feast until its 21-day cutoff. Send early enough for confirmation before the cutoff.'],
  ['Day 21 → at least day 28', 'Score & review', 'Contributions are closed. Publish receipts, prices and the allocation CSV hash committed onchain. Finalization requires seven days since the last allocation edit and the matching hash. No Feast claims or promised trading during review.'],
  ['Finalization F → F + 90 days', 'Claim & trade', 'Contributors claim their frozen allocation. Liquid: 50% at F, the other 50% over 60 days. Locked: 12/24-month term starts at claim, with its reward already reserved at finalization. Trading opens only after the pool is funded and its custody and LP lock are verified.'],
  ['At F + 90 days / ongoing', 'Close claims; keep building', 'Remaining Feast claim inventory can be burned. Existing locks keep their escrow and exit rights. New locks depend on reward capacity; community awards follow published rounds.'],
];
export default function LaunchTimeline() {
  const t = isLaunchConfigured && launch.freeClaimsStartMs > 0 ? launch.freeClaimsStartMs : null;
  const date=(ms:number)=>new Date(ms).toISOString().replace('T',' ').replace('.000Z',' UTC');
  return <section id="timeline" className="section timeline-section"><div className="section-heading"><div><div className="kicker">THE LAUNCH / WHO CAN DO WHAT, WHEN</div><h2>ONE OPENING.<br/><em>CLEAR WINDOWS.</em></h2></div><p>Day 0 is the published UTC opening of free claims and the Feast. F is the actual Feast finalization, after scoring and review. No date has been promised before verification.</p></div>
    <div className="timeline-dates"><span className="status-label">{t ? `DAY 0: ${date(t)}` : 'OPENING DATE NOT ANNOUNCED'}</span>{t && <p>Free applications: {date(t-7*86400000)} → {date(t)}. Free claims close: {date(t+14*86400000)}. Feast contributions close: {date(t+21*86400000)}.</p>}<p className="fine-print">End timestamps are exclusive. Scoring or security delays postpone F; they never reopen free claims. Every allocation edit restarts an onchain seven-day review. Ordinary lock opening dates, free-claim dates and the 90-day Feast claim deadline are enforced onchain. Exchange funding and opening remain disclosed trust assumptions.</p></div>
    <ol className="launch-timeline">{phases.map(([window,title,text],i)=><li key={title}><div className="timeline-marker">{String(i+1).padStart(2,'0')}</div><div><span>{window}</span><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    <p className="fine-print">An allocation is not a live trading pool. Contributors receive no refund path; finalization requires full locked-reward funding, and unclaimed allocations expire after 90 days. <a href={siteUrl('whitepaper/')}>Read the full release rules ↗</a></p>
  </section>;
}
