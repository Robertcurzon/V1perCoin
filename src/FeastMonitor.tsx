import { useEffect, useState } from 'react';
import { useCurrentClient } from '@mysten/dapp-kit-react';
import { launch, isLaunchConfigured } from './manifest';
import { readChainState } from './chainState';
import { readVestingSchedule } from './feastVesting';
import { treasuryExplorer, vestedAllocation } from './feastData';
import { FeastAllocationBcs } from './chainSchemas';
import { formatAmount } from './economics';
import { siteUrl } from './site';
import { dataIsStale } from './explorer';
import accepted from '../scripts/feast/config.json';
import { parseFeastReport, type FeastReport } from './feastReport';
export default function FeastMonitor() {
  const client = useCurrentClient();
  const [state, setState] = useState<Awaited<ReturnType<typeof readChainState>> | null>(null);
  const [schedule, setSchedule] = useState<ReturnType<typeof FeastAllocationBcs.parse>[] | null>(null);
  const [report, setReport] = useState<FeastReport | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState(''), [reportError, setReportError] = useState(''), [busy, setBusy] = useState(false), [stale, setStale] = useState(true);
  useEffect(() => {
    if (!isLaunchConfigured) return;
    let active = true, loading = false;
    const controller = new AbortController();
    async function refresh() {
      if (loading) return; loading = true; setNow(Date.now());
      try {
        const value = await readChainState(client, AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]));
        if (active) { setState(value); setError(''); setStale(false); setReceivedAt(Date.now()); }
      } catch (e) { if (active) { setError((e as Error).message); setStale(true); } }
      finally { loading = false; }
    }
    void refresh(); const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [client]);
  useEffect(() => {
    if (!isLaunchConfigured || !/^[a-f0-9]{64}$/.test(launch.feastResultsSha256)) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(siteUrl('feast-results.json'), { signal: controller.signal });
        if (!response.ok) throw new Error(`Contribution report HTTP ${response.status}`);
        const raw = await response.arrayBuffer();
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', raw))].map(n => n.toString(16).padStart(2,'0')).join('');
        if (digest !== launch.feastResultsSha256) throw new Error('Contribution report hash does not match the release.');
        const r = parseFeastReport(JSON.parse(new TextDecoder().decode(raw)),accepted.coins.map(c=>c.id),launch.feastStartMs/1000);
        if (!controller.signal.aborted) { setReport(r); setReportError(''); }
      } catch (e) { if (!controller.signal.aborted) setReportError((e as Error).message); }
    })(); return () => controller.abort();
  }, []);
  async function loadVesting() {
    if (!state || busy) return; setBusy(true); setError('');
    try { const fresh = await readChainState(client); setSchedule(await readVestingSchedule(client, fresh.f)); setState(fresh); setStale(false); setReceivedAt(Date.now()); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const vested = state?.f.finalized && schedule ? schedule.reduce((n,a) => n + vestedAllocation(a, state.time - BigInt(state.f.start_ms)), 0n) : null;
  return <section className="transparency"><div className="kicker">FEAST / FEEDING RECORDS</div><h2>FOLLOW<br/><em>THE FEAST.</em></h2><div className="monitor-metrics">{[['Feast claimed', state ? formatAmount(BigInt(state.f.claimed)) : '—'],['Feast actually burned', state ? formatAmount(BigInt(state.f.burned)) : '—'],['Feast inventory', state ? formatAmount(BigInt(state.f.inventory)) : '—'],['Reserved Feast rewards',state ? formatAmount(BigInt(state.f.reward_reserve)) : '—'],['Scheduled vested total', vested === null ? '—' : formatAmount(vested)],['Feast clearing price (USD / V1PR)', report?.clearingPrice ? (Number(report.clearingPrice.usdNumerator) / Number(report.clearingPrice.tokenDenominator)).toPrecision(8) : 'UNPUBLISHED']].map(([label,value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    {state && <p className="fine-print">CSV commitment: {state.f.allocations_hash.length === 32 ? state.f.allocations_hash.map(n=>n.toString(16).padStart(2,'0')).join('') : 'not committed'}. {state.f.allocations_hash.length === 32 && <>Earliest finalization: {new Date(Number(BigInt(state.f.last_change_ms)+7n*86400000n)).toISOString()}.</>}</p>}
    <button className="button outline" disabled={!state?.f.finalized || busy || Boolean(schedule)} onClick={() => void loadVesting()}>{busy ? 'READING ALLOCATIONS…' : 'LOAD COMPLETE VESTING SCHEDULE'}</button><p className="fine-print">{state ? `Chain time ${new Date(Number(state.time)).toLocaleString()}${stale || dataIsStale(receivedAt, now) ? ' · STALE' : ''}. ` : ''}Vesting totals require a complete reconciled read of the frozen allocation table. Scheduled vested includes already claimed amounts and fully eligible locked allocations; it is not currently claimable inventory. Unclaimed allocations expire after 90 days. Failed reads show unavailable, never invented zero totals.</p>
    <h3>V1PR FOUNDATION (FOUNDER-CONTROLLED)</h3><div className="custody-grid">{Object.entries(launch.feastTreasury).map(([chain,address]) => <article className="lock-card" key={chain}><h4>{chain.toUpperCase()}</h4><p className="coin-type">{isLaunchConfigured && treasuryExplorer(chain,address) ? <a href={treasuryExplorer(chain,address)!} target="_blank" rel="noreferrer">{address} ↗</a> : 'Address not published'}</p>{accepted.coins.filter(c => c.chain === chain).map(c => <p key={c.id}>{c.symbol}: {report ? (Number(report.treasuryReceivedBaseUnits[c.id]) / 10 ** c.decimals).toLocaleString('en-US', { maximumSignificantDigits: 10 }) : '—'} received</p>)}</article>)}</div>
    <p className="fine-print">Received totals are the published report's finalized, accepted-coin transfers during the 21-day Feast, including unbound sources. They are a dated export, not live balances or a complete chain index. {report && <>Report window begins {new Date(report.windowStart * 1000).toLocaleString()}; CSV SHA-256 {report.csvSha256}; scoring commit {report.scriptCommit}. <a href={siteUrl('feast-results.json')}>Inspect report and receipt audit ↗</a></>}</p>
    {(error || reportError) && <p role="alert" className="transaction-message">{error || reportError}</p>}
  </section>;
}
