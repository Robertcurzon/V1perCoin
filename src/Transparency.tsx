import { useEffect, useState } from 'react';
import { useCurrentClient } from '@mysten/dapp-kit-react';
import { launch, isLaunchConfigured } from './manifest';
import ExplorerLink from './ExplorerLink';
import { shortId, dataIsStale } from './explorer';
import { formatAmount } from './economics';
import { decodeActivity, type Activity } from './activity';
const wallets = [
  { label: 'V1PR Foundation / Operations & exit fees', address: launch.founder, note: '10% initial allocation; founder-controlled, no vesting.' },
  { label: 'Community programs', address: launch.community, note: '20% initial allocation plus 40% of early-exit fees; discretionary program budget.' },
  { label: 'Initial liquidity reserve', address: launch.initialLiquidity, note: '20% initial allocation; wallet inventory does not prove active exchange liquidity.' },
  { label: 'Later liquidity reserve', address: launch.laterLiquidity, note: '15% initial allocation; custodian-controlled.' },
];
export default function Transparency() {
  const client = useCurrentClient();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [receivedAt, setReceivedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLaunchConfigured) return;
    let active = true, busy = false;
    const controller = new AbortController();
    async function refresh() {
      if (busy) return;
      busy = true;
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]);
      try {
        const validWallets = wallets.filter((w) => /^0x[0-9a-fA-F]{64}$/.test(w.address) && BigInt(w.address) !== 0n);
        const results = await Promise.allSettled([
          ...validWallets.map(async (w) => ({ address: w.address, value: (await client.core.getBalance({ owner: w.address, coinType: launch.coinType, signal })).balance.balance })),
        ]);
        const next: Record<string, string> = {};
        for (const result of results) if (result.status === 'fulfilled') next[result.value.address] = result.value.value;
        // Independent module queries: partial balance errors cannot erase valid activity.
        const pages = await Promise.allSettled(['lock_vault','free_claims'].map((module) => client.core.listEvents({ filter: { emitModule: `${launch.packageId}::${module}` }, order: 'descending', limit: 20, signal })));
        const decoded = pages.flatMap((p) => p.status === 'fulfilled' ? p.value.events.flatMap((e) => { const entry = decodeActivity(e, launch.packageId, launch.vaultId, launch.claimsId); return entry ? [entry] : []; }) : []);
        decoded.sort((a, b) => {
          const aa = BigInt(a.checkpoint ?? '0'), bb = BigInt(b.checkpoint ?? '0');
          return aa === bb ? a.digest === b.digest ? b.index - a.index : a.digest.localeCompare(b.digest) : aa > bb ? -1 : 1;
        });
        if (active) {
          setBalances(next); setEvents(decoded.slice(0, 20)); setReceivedAt(Date.now()); setNow(Date.now());
          setError([...results, ...pages].some((p) => p.status === 'rejected') ? 'Some wallet or event queries failed. Missing values are unavailable; the activity list may be incomplete.' : '');
        }
      } catch (e) { if (active) setError((e as Error).message); }
      finally { busy = false; }
    }
    void refresh();
    const interval = window.setInterval(() => { setNow(Date.now()); void refresh(); }, 30_000);
    window.addEventListener('focus', refresh);
    return () => { active = false; controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [client]);
  return <section className="transparency"><div className="kicker">VERIFY / FOLLOW THE TOKENS</div><h2>PUBLIC PROOF.<br/><em>REAL LOCATIONS.</em></h2>
    <p>Inspect the exact coin, contracts and custody addresses on Suiscan. {isLaunchConfigured ? `All links use Sui ${launch.network}. Deployment records are operator-supplied; explorer links enable independent verification.` : 'Deployment records are not published yet. Links and live balances appear only after configuration.'}</p>
    <div className="proof-links">{[['coin','V1PR coin / transfers',launch.coinType],['object','Move package / contract',launch.packageId],['object','Currency / actual supply',launch.currencyId],['object','Lock reward vault',launch.vaultId],['object','Free claim pool',launch.claimsId],['object','Feast claim pool',launch.feastId],['object','Feast admin capability',launch.feastAdminCapId],['object','Vault admin capability',launch.vaultAdminCapId],['object','Claim admin capability',launch.claimsAdminCapId],['object','Exchange pair',launch.dexPairId],['tx','Publication transaction',launch.publishDigest],['tx','Allocation transaction',launch.allocationDigest],['tx','Package immutability transaction',launch.immutableDigest],['tx','Metadata authority deletion',launch.metadataDigest]].map(([kind,label,id]) => <div key={label}>{isLaunchConfigured ? <ExplorerLink kind={kind as 'coin' | 'object' | 'tx'} value={id}>{label}</ExplorerLink> : <span>{label} · not configured</span>}</div>)}</div>
    <h3>CUSTODY DIRECTORY</h3><div className="custody-grid">{wallets.map((w) => <article className="lock-card" key={w.label}><h4>{w.label}</h4><p className="coin-type">{isLaunchConfigured && w.address ? <ExplorerLink kind="account" value={w.address}>{w.address}</ExplorerLink> : 'Address not published'}</p><strong>{balances[w.address] === undefined ? 'Balance unavailable' : `${formatAmount(BigInt(balances[w.address]))} V1PR`}</strong><p className="fine-print">{w.note}</p></article>)}</div>
    <p className="fine-print">Balances are current wallet holdings, not remaining allocation entitlements. All four custody destinations are distinct. Escrowed rewards and principal live in the vault and user position objects, not these wallet balances.</p>
    <h3>RECENT CONTRACT ACTIVITY</h3><p className="fine-print">{receivedAt ? `Last fetched ${new Date(receivedAt).toLocaleString()}${dataIsStale(receivedAt, now) ? ' · STALE' : ''}` : 'Awaiting onchain events'}. Up to 20 recent matching events from two module queries; not a complete transaction history. Equal-checkpoint entries have no inferred cross-transaction ordering. Ordinary transfers and trades are available through the coin explorer link.</p>
    {error && <p role="alert" className="transaction-message">{error}</p>}
    <div className="activity-list">{events.length ? events.map((e) => <article key={`${e.digest}:${e.index}`}><div><strong>{e.label}</strong><span>{e.amount !== undefined && `${formatAmount(BigInt(e.amount))} V1PR`}</span></div><p>{e.time ? new Date(Number(e.time)).toLocaleString() : `Checkpoint ${e.checkpoint ?? 'unavailable'}`} · <ExplorerLink kind="tx" value={e.digest}>{shortId(e.digest)}</ExplorerLink>{e.owner && <> · <ExplorerLink kind="account" value={e.owner}>{shortId(e.owner)}</ExplorerLink></>}</p>{e.detail && <p className="fine-print">{e.detail}</p>}</article>) : <p>{isLaunchConfigured ? 'No activity loaded. Check query status and the explorer before concluding there has been no activity.' : 'No deployed activity to display.'}</p>}</div>
  </section>;
}
