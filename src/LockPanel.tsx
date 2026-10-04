import { V1per, BrandText } from './V1per';
import { siteUrl } from './site';
import { useEffect, useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import type { SuiClientTypes } from '@mysten/sui/client';
import { PositionBcs, VaultBcs } from './chainSchemas';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { readChainState } from './chainState';
import ExplorerLink from './ExplorerLink';
import { launch, isLaunchConfigured as configured } from './manifest';
import { exitPreview, formatAmount, fullReward, MONTH_MS, netReward, parseAmount, ratePpm } from './economics';

type Position = ReturnType<typeof PositionBcs.parse>;
type Vault = ReturnType<typeof VaultBcs.parse>;

export default function LockPanel({ detailed = false }: { detailed?: boolean }) {
  const [months, setMonths] = useState(24);
  const [amount, setAmount] = useState('10000');
  const [vault, setVault] = useState<Vault | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string>();
  const [chainTime, setChainTime] = useState(0n);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const kit = useDAppKit();
  let principal = 0n;
  let inputError = '';
  try { principal = parseAmount(amount); } catch (e) { inputError = (e as Error).message; }
  const reward = fullReward(principal, months);

  useEffect(() => {
    if (!configured) return;
    let active = true, busy = false;
    const controller = new AbortController();
    const owner = account?.address;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const state = await readChainState(client, AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]));
        const parsed = state.v;
        const found: Position[] = [];
        if (owner) {
          let cursor: string | null = null;
          do {
            const page: SuiClientTypes.ListOwnedObjectsResponse<{ content: true }> = await client.core.listOwnedObjects({ owner, type: `${launch.packageId}::lock_vault::Position`, cursor, include: { content: true }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) });
            for (const object of page.objects) {
              const position = PositionBcs.parse(object.content);
              if (position.vault === launch.vaultId.toLowerCase() && position.owner === owner.toLowerCase()) found.push(position);
            }
            cursor = page.hasNextPage ? page.cursor : null;
          } while (cursor);
        }
        if (active) { setVault(parsed); setChainTime(state.time); setPositions(found); setLoadedOwner(owner); setError(''); }
      } catch (e) { if (active) { setVault(null); setPositions([]); setError((e as Error).message); } }
      finally { busy = false; }
    }
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => { active = false; controller.abort(); window.clearInterval(interval); };
  }, [account?.address, client, revision]);

  async function submit(action: 'deposit' | 'withdraw', position?: Position) {
    if (!configured || !account || !vault || pending) return;
    setPending(true); setError(''); setMessage('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw new Error('Connected wallet does not support the configured network.');
      if (action === 'deposit' && (state.time < BigInt(state.v.opens_at_ms))) throw new Error('New locks open at the published day-0 opening.');
      if (action === 'deposit' && state.v.paused) throw new Error('New locks are paused. Existing locks can still exit.');
      const tx = new Transaction();
      tx.setSender(account.address);
      if (action === 'deposit') {
        const value = parseAmount(amount);
        if (netReward(value, months) === 0n || fullReward(value, months) > BigInt(state.v.rewards)) throw new Error('This lock exceeds available reward capacity or is too small.');
        tx.moveCall({ target: `${launch.packageId}::lock_vault::deposit`, arguments: [tx.object(launch.vaultId), coinWithBalance({ type: launch.coinType, balance: value }), tx.pure.u64(months), tx.object('0x6')] });
      }
      if (action === 'withdraw' && position) tx.moveCall({ target: `${launch.packageId}::lock_vault::withdraw`, arguments: [tx.object(launch.vaultId), tx.object(position.id), tx.object('0x6')] });
      const result = await kit.signAndExecuteTransaction({ transaction: tx });
      if (result.FailedTransaction) throw new Error(result.FailedTransaction.status.error?.message ?? 'Transaction failed.');
      await client.core.waitForTransaction({ digest: result.Transaction.digest });
      setMessage(result.Transaction.digest);
      setRevision((value) => value + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  }
  const visiblePositions = loadedOwner === account?.address ? positions : [];
  const lockOpen = configured && vault !== null && chainTime >= BigInt(vault.opens_at_ms);
  const capacity = vault ? BigInt(vault.rewards) : null;
  return <section id="lock" className="section lock-section">
    <div className="kicker">LOCK & EARN / FUNDED REWARDS</div>
    <h2>LONGER LOCK.<br/><em>BIGGER BITE.</em></h2>
    <p className="token-intro">1–10% annual <V1per /> rates for 1–24 months; first come, first fully funded.</p>
    <p className="lock-summary">Early exit: up to 5% of principal × time remaining; no fee at maturity.</p>
    <a className="text-link" href={siteUrl('rules/#lock')}>Full rules →</a>
    <div className="lock-grid">
      <div className="lock-card">
        <label htmlFor="lock-amount"><V1per /> to lock</label><input id="lock-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label htmlFor="lock-months">{months} program months · {months * 30} days</label><input id="lock-months" type="range" min="1" max="24" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
        <div className="facts"><div><span>ANNUAL TOKEN REWARD RATE</span><strong>{(Number(ratePpm(months)) / 10000).toFixed(4)}%</strong></div><div><span>TOTAL TERM RATE</span><strong>{(Number(ratePpm(months)) / 10000 * months / 12).toFixed(4)}%</strong></div><div><span>MATURE EXIT FEE (0%)</span><strong>0 <V1per /></strong></div><div><span>TOTAL TERM REWARD</span><strong>{formatAmount(reward)} <V1per /></strong></div><div><span>FULL-TERM NET PAYOUT</span><strong>{formatAmount(principal + reward)} <V1per /></strong></div><div><span>AVAILABLE REWARD CAPACITY</span><strong><BrandText text={capacity === null ? 'NOT DEPLOYED / UNAVAILABLE' : `${formatAmount(capacity)} V1PER`} /></strong></div></div>
        {inputError && <p role="alert">{inputError}</p>}{principal > 0n && netReward(principal, months) === 0n && <p role="alert">Increase the amount to earn at least one <V1per /> base unit for the selected term.</p>}
        {detailed && <p className="fine-print">One month = 30 days. Simple rewards in <V1per />; no compounding or dollar-return promise. No deposit fee. No fee at maturity. Early exit pays the reward for whole completed months and charges up to 5% of principal, tapering continuously to zero. Every completed lock earns a positive net <V1per /> reward before network gas. Early exits can return less than deposited.</p>}
        <ConnectButton />
        <div className="buttons"><button className="button lime" disabled={!lockOpen || !account || !vault || vault.paused || pending || Boolean(inputError) || netReward(principal, months) === 0n || (capacity !== null && reward > capacity)} onClick={() => void submit('deposit')}>{!configured ? 'Not live yet' : pending ? 'PROCESSING…' : 'OPEN LOCK'}</button></div>
      </div>

    </div>
    {visiblePositions.length > 0 && <div className="positions"><h3>YOUR LOCKS</h3>{visiblePositions.map((position) => {
      const quote = exitPreview(BigInt(position.principal), BigInt(position.reward), BigInt(position.duration_ms), chainTime - BigInt(position.start_ms));
      return <article className="lock-card" key={position.id}><p>{formatAmount(BigInt(position.principal))} <V1per /> · {Number(BigInt(position.duration_ms) / MONTH_MS)} months</p><p><ExplorerLink kind="object" value={position.id}>View position</ExplorerLink></p><p>Matures {new Date(Number(BigInt(position.start_ms) + BigInt(position.duration_ms))).toLocaleString()}</p><p>Earned {formatAmount(quote.earned)} · Fee {formatAmount(quote.fee)} <V1per /></p><p>Community {formatAmount(quote.community)} · Pending burn {formatAmount(quote.burn)} · Foundation {formatAmount(quote.founder)}</p><p>Net payout: {formatAmount(quote.net)} <V1per /></p><p className="fine-print">Preview uses the last fetched onchain clock. The transaction uses the current onchain time.</p><button className="button outline" disabled={pending || !vault} onClick={() => void submit('withdraw', position)}>WITHDRAW</button></article>;
    })}<button className="button outline" disabled={pending} onClick={() => setRevision((value) => value + 1)}>REFRESH PREVIEW</button></div>}
    {error && <p role="alert" className="transaction-message"><BrandText text={error} /></p>}{message && <p role="status" className="transaction-message">Confirmed: <ExplorerLink kind="tx" value={message}><BrandText text={message} /></ExplorerLink></p>}
  </section>;
}
