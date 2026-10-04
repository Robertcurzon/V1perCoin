import { V1per, BrandText } from './V1per';
import { siteUrl } from './site';
import { useEffect, useState } from 'react';
import { useCurrentClient } from '@mysten/dapp-kit-react';
import { readChainState, INITIAL_SUPPLY } from './chainState';
import Transparency from './Transparency';
import FeastMonitor from './FeastMonitor';
import ExplorerLink from './ExplorerLink';
import { dataIsStale } from './explorer';
import { launch, isLaunchConfigured } from './manifest';
import { readDexVolume } from './volume';
import { formatAmount } from './economics';

type Snapshot = {
  time: number; volume24h: string | null; supply: string; available: string; committed: string; paid: string;
  funded: string; locked: string; burned: string; pendingBurn: string; opened: string; closed: string;
  claims: string; community: string; founder: string;
};
const historyKey = `v1per-monitor:${launch.network}:${launch.vaultId}`;
function readHistory(): Snapshot[] {
  if (!isLaunchConfigured) return [];
  try {
    const data: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((entry): entry is Snapshot => Boolean(entry && typeof entry === 'object' && typeof entry.time === 'number' && Number.isSafeInteger(entry.time) && entry.time > 0 && ['supply','available','committed','paid','funded','locked','burned','pendingBurn','opened','closed','claims','community','founder'].every((key) => typeof entry[key] === 'string' && /^\d+$/.test(entry[key])))).map((entry) => ({ ...entry, volume24h: typeof entry.volume24h === 'string' && /^\d+(\.\d+)?$/.test(entry.volume24h) ? entry.volume24h : null })).slice(-720);
  } catch { return []; }
}
function Chart({ title, samples, series, tokens = true, unit = 'V1PER' }: {
  title: string; samples: Snapshot[]; series: { key: keyof Omit<Snapshot, 'time'>; name: string; color: string }[]; tokens?: boolean; unit?: string;
}) {
  const divisor = tokens && unit === 'V1PER' ? 1_000_000 : 1;
  const max = Math.max(1, ...samples.flatMap((sample) => series.map((line) => Number(sample[line.key]) / divisor)));
  const width = 600, height = 190;
  return <article className="monitor-chart"><h3><BrandText text={title} /></h3>{samples.length === 0 ? <div className="chart-empty">Awaiting verified deployment and onchain samples.</div> : <>
    <svg viewBox={`0 0 ${width + 65} ${height + 35}`} role="img" aria-label={`${title}. ${samples.length} observed onchain snapshots, vertical axis starts at zero.`}>
      {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="60" x2={width + 60} y1={height * (1-fraction)+5} y2={height * (1-fraction)+5} stroke="#475d3f"/><text x="2" y={height * (1-fraction)+10} fill="#aab8a5" fontSize="11">{(max * fraction).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 })}</text></g>)}
      {series.map((line) => {
        const coordinates = samples.map((sample) => [60 + (sample.time - samples[0].time) * width / Math.max(1, samples[samples.length - 1].time - samples[0].time), 5 + height * (1 - Number(sample[line.key]) / divisor / max)]);
        return <g key={line.key}><polyline fill="none" stroke={line.color} strokeWidth="2.5" points={coordinates.map((point) => point.join(',')).join(' ')}/>{coordinates.length === 1 && <circle cx={coordinates[0][0]} cy={coordinates[0][1]} r="4" fill={line.color}/>}</g>;
      })}
    </svg><div className="chart-times"><span>{new Date(samples[0].time).toLocaleString()}</span><span>{new Date(samples[samples.length-1].time).toLocaleString()}</span></div>
  </>}<div className="chart-legend">{series.map((line) => <span key={line.key}><i style={{ background: line.color }}/>{line.name}{tokens && <> (<BrandText text={unit} />)</>}</span>)}</div></article>;
}

export default function Monitor() {
  const client = useCurrentClient();
  const [samples, setSamples] = useState<Snapshot[]>(readHistory);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [volumeError, setVolumeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receivedAt, setReceivedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [proof, setProof] = useState<Awaited<ReturnType<typeof readChainState>>['objects']>([]);
  const latest = samples[samples.length - 1];
  useEffect(() => {
    if (!isLaunchConfigured) return;
    let active = true, busy = false;
    const controller = new AbortController();
    async function refresh() {
      if (busy) return;
      busy = true;
      try {
        setLoading(true);
        const state = await readChainState(client, AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]));
        const { c, v, p } = state;
        if (c.supply?.$kind !== 'BurnOnly') throw new Error('Burn-only supply unavailable.');
        const supply = BigInt(c.supply.BurnOnly);
        const sample: Snapshot = {
          time: Number(state.time), volume24h: null, supply: supply.toString(),
          available: v.rewards, committed: v.reward_committed, paid: v.reward_paid, funded: v.reward_funded,
          pendingBurn: v.pending_burn, locked: v.total_locked, burned: (INITIAL_SUPPLY - supply).toString(), opened: v.locks_opened, closed: v.locks_closed,
          claims: p.claimed, community: v.community_paid, founder: v.founder_paid,
        };
        if (launch.network === 'mainnet' && /^0x[0-9a-fA-F]{64}$/.test(launch.dexPairId)) {
          try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/sui/${launch.dexPairId}`, { signal: AbortSignal.timeout(10_000) });
            if (!response.ok) throw new Error(`Volume provider returned HTTP ${response.status}.`);
            sample.volume24h = readDexVolume(await response.json(), launch.dexPairId, launch.coinType).toString();
            if (active) setVolumeError('');
          } catch (e) { if (active) setVolumeError((e as Error).message); }
        }
        if (active) {
          setSamples((previous) => {
            const next = [...previous.filter((entry) => entry.time < sample.time), sample].slice(-720);
            try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* Live metrics still work without browser storage. */ }
            return next;
          });
          setError(''); setReceivedAt(Date.now()); setNow(Date.now()); setProof(state.objects);
        }
      } catch (e) { if (active) setError((e as Error).message); }
      finally { busy = false; if (active) setLoading(false); }
    }
    void refresh();
    const interval = window.setInterval(() => { setNow(Date.now()); void refresh(); }, 30_000);
    window.addEventListener('focus', refresh);
    return () => { active = false; controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [client, revision]);
  const value = (key: keyof Omit<Snapshot, 'time' | 'volume24h'>, tokens = true) => latest ? tokens ? formatAmount(BigInt(latest[key])) : BigInt(latest[key]).toLocaleString() : '—';
  return <div className="site monitor-page"><header className="header"><a className="brand" href={siteUrl('')}><img src={siteUrl('viper-logo.webp')} alt=""/><span><V1per /><span className="accent">.</span></span></a><a className="text-link" href={siteUrl('')}><V1per /> Coin (<V1per />) ↗</a></header><main className="section">
    <div className="kicker"><V1per /> / ONCHAIN MONITOR</div><h1>FOLLOW<br/><em>THE BITE.</em></h1>
    <p className="token-intro"><V1per /> Coin (<V1per />): supply, funded rewards and community contract activity. {isLaunchConfigured ? `Sui ${launch.network}; refreshes every 30 seconds.` : 'No verified deployment is configured. No live figures or trading activity are implied.'}</p>
    <p className="fine-print coin-type">Coin type: {isLaunchConfigured ? launch.coinType : 'NOT DEPLOYED'}</p>
    <div className="monitor-metrics">{[
      ['Current total supply', value('supply')], ['Total actually burned', value('burned')], ['Pending exit burns', value('pendingBurn')], ['Available lock rewards', value('available')], ['Reserved lock rewards', value('committed')], ['Rewards paid', value('paid')], ['Total rewards funded', value('funded')], ['V1PER currently locked', value('locked')], ['Locks opened / closed', `${value('opened', false)} / ${value('closed', false)}`], ['Free claims paid', value('claims', false)], ['Community exit-fee receipts', value('community')], ['V1PER Foundation exit-fee receipts', value('founder')],
    ].map(([label, metric]) => <article key={label}><span><BrandText text={label} /></span><strong>{metric}</strong></article>)}</div>
    <div className="monitor-controls"><button className="button outline" disabled={!isLaunchConfigured || loading} onClick={() => setRevision((n) => n + 1)}>{loading ? 'REFRESHING…' : 'REFRESH DATA'}</button><span className="fine-print">{latest ? `Last snapshot: ${new Date(latest.time).toLocaleString()}${error || dataIsStale(receivedAt, now) ? ' · STALE / SAVED OBSERVATION' : ' · FRESH RPC READ'}` : 'Awaiting onchain data'}</span></div>
    {error && <p className="transaction-message" role="alert">Unable to refresh: <BrandText text={error} />. Any existing chart shows the last saved observations.</p>}
    <div className="proof-links">{proof.map((p) => <div key={p.id}><ExplorerLink kind="object" value={p.id}>{p.label}</ExplorerLink> · version {p.version} · <ExplorerLink kind="tx" value={p.digest ?? ''}>Last change</ExplorerLink></div>)}</div>
    <div className="monitor-grid"><Chart title="TOTAL TOKEN SUPPLY" samples={samples} series={[{key:'supply',name:'Supply',color:'#bdf332'},{key:'burned',name:'Burned',color:'#fa9a66'},{key:'pendingBurn',name:'Pending burn',color:'#66c9f3'}]}/><Chart title="REWARD POOL" samples={samples} series={[{key:'available',name:'Available',color:'#bdf332'},{key:'committed',name:'Reserved',color:'#66c9f3'},{key:'paid',name:'Paid',color:'#fa9a66'}]}/><Chart title="LOCKED V1PER" samples={samples} series={[{key:'locked',name:'Locked principal',color:'#bdf332'}]}/><Chart title="CONTRACT INTERACTIONS" samples={samples} tokens={false} series={[{key:'opened',name:'Locks opened',color:'#bdf332'},{key:'closed',name:'Locks closed',color:'#66c9f3'},{key:'claims',name:'Claims paid',color:'#fa9a66'}]}/></div>
    <Chart title="EXCHANGE VOLUME / ROLLING 24H USD" samples={samples.filter((sample) => sample.volume24h !== null && sample.volume24h !== undefined)} unit="USD" series={[{key:'volume24h',name:'Configured pair 24h volume',color:'#66c9f3'}]}/>
    <p className="fine-print">{launch.dexPairId ? `Source: DEX Screener, configured Sui pair ${launch.dexPairId}. Rolling 24-hour USD volume for this pair only; not all-exchange volume or cumulative lifetime trading. ${volumeError ? `Volume unavailable/stale: ${volumeError}` : ''}` : 'Trading volume is not available until a real, verified mainnet exchange pair is configured. No synthetic trades or zero-volume claim is displayed.'} <a href="https://docs.dexscreener.com/api/reference" target="_blank" rel="noreferrer">Provider documentation ↗</a></p>
    <p className="fine-print">Charts show observed onchain snapshots stored in this browser, starting when this page first loads after deployment. They are not a complete historical index. Counters are cumulative successful lock opens, closes and free claims; they do not count ordinary transfers, unique people, every transaction, or exchange trades. Total supply includes reserves and locked inventory; it is not circulating supply. Separate object reads can briefly span concurrent transactions. Network/API failures leave saved data marked stale.</p>
    <a className="text-link" href={siteUrl('rules/#timeline')}>The launch, step by step →</a>
    <FeastMonitor />
    <Transparency />
  </main></div>;
}
