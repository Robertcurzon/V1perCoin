import { siteUrl } from './site';
import { useEffect, useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import type { SuiClientTypes } from '@mysten/sui/client';
import { PositionBcs, VaultBcs } from './chainSchemas';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { readChainState, objectAbsent } from './chainState';
import ExplorerLink from './ExplorerLink';
import { launch, isLaunchConfigured as configured } from './manifest';
import { exitPreview, formatAmount, fullReward, MONTH_MS, netReward, parseAmount, ratePpm } from './economics';

type Position = ReturnType<typeof PositionBcs.parse>;
type Vault = ReturnType<typeof VaultBcs.parse>;

export default function LockPanel() {
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

  async function submit(action: 'deposit' | 'claim' | 'withdraw', position?: Position) {
    if (!configured || !account || !vault || pending) return;
    setPending(true); setError(''); setMessage('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw new Error('Connected wallet does not support the configured network.');
      if (action === 'claim') {
        if (BigInt(state.p.end_ms) === 0n || state.time < BigInt(state.p.start_ms)) throw new Error('The free-claim window is not open.');
        if (state.time >= BigInt(state.p.end_ms)) throw new Error('The 14-day free-claim window has ended.');
        let claimed: boolean;
        try {
          const { dynamicField } = await client.core.getDynamicField({ parentId: state.p.eligibility.id, name: { type: 'address', bcs: bcs.Address.serialize(account.address).toBytes() }, signal: AbortSignal.timeout(20_000) });
          claimed = bcs.bool().parse(dynamicField.value.bcs);
        } catch (error) {
          if (objectAbsent(error)) throw new Error('This wallet is not approved for a free claim.');
          throw new Error('Network or data error: claim eligibility could not be verified. Please retry.');
        }
        if (claimed) throw new Error('This wallet already claimed its allocation.');
      }
      if (action === 'deposit' && (launch.freeClaimsStartMs === 0 || state.time < BigInt(launch.freeClaimsStartMs))) throw new Error('New locks open at the published day-0 opening.');
      if (action === 'deposit' && state.v.paused) throw new Error('New locks are paused. Existing locks can still exit.');
      const tx = new Transaction();
      tx.setSender(account.address);
      if (action === 'claim') tx.moveCall({ target: `${launch.packageId}::free_claims::claim`, arguments: [tx.object(launch.claimsId), tx.object('0x6')] });
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
  const lockOpen = configured && launch.freeClaimsStartMs > 0 && chainTime >= BigInt(launch.freeClaimsStartMs);
  const freeOpen = lockOpen && chainTime < BigInt(launch.freeClaimsStartMs) + 14n * 86_400_000n;
  const capacity = vault ? BigInt(vault.rewards) : null;
  return <section id="lock" className="section lock-section">
    <div className="kicker">LOCK & EARN / FUNDED REWARDS</div>
    <h2>LONGER LOCK.<br/><em>BIGGER BITE.</em></h2>
    <p className="token-intro">First come, first served. The 150 million V1PR reward pool funds accepted locks until available capacity is exhausted. Your full reward is reserved when your lock opens.</p>
    <div className="lock-grid">
      <div className="lock-card">
        <label htmlFor="lock-amount">V1PR to lock</label><input id="lock-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label htmlFor="lock-months">{months} program months · {months * 30} days</label><input id="lock-months" type="range" min="1" max="24" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
        <div className="facts"><div><span>ANNUAL TOKEN REWARD RATE</span><strong>{(Number(ratePpm(months)) / 10000).toFixed(4)}%</strong></div><div><span>TOTAL TERM RATE</span><strong>{(Number(ratePpm(months)) / 10000 * months / 12).toFixed(4)}%</strong></div><div><span>MATURE EXIT FEE (0%)</span><strong>0 V1PR</strong></div><div><span>TOTAL TERM REWARD</span><strong>{formatAmount(reward)} V1PR</strong></div><div><span>FULL-TERM NET PAYOUT</span><strong>{formatAmount(principal + reward)} V1PR</strong></div><div><span>AVAILABLE REWARD CAPACITY</span><strong>{capacity === null ? 'NOT DEPLOYED / UNAVAILABLE' : `${formatAmount(capacity)} V1PR`}</strong></div></div>
        {inputError && <p role="alert">{inputError}</p>}{principal > 0n && netReward(principal, months) === 0n && <p role="alert">Increase the amount to earn at least one V1PR base unit for the selected term.</p>}
        <p className="fine-print">One month = 30 days. Simple rewards in V1PR; no compounding or dollar-return promise. No deposit fee. No fee at maturity. Early exit pays the reward for whole completed months and charges up to 5% of principal, tapering continuously to zero. Every completed lock earns a positive net V1PR reward before network gas. Early exits can return less than deposited.</p>
        <ConnectButton />
        <div className="buttons"><button className="button lime" disabled={!lockOpen || !account || !vault || vault.paused || pending || Boolean(inputError) || netReward(principal, months) === 0n || (capacity !== null && reward > capacity)} onClick={() => void submit('deposit')}>{pending ? 'PROCESSING…' : 'OPEN LOCK'}</button></div>
      </div>
      <div className="lock-card">
        <h3>FIRST COME. FULLY FUNDED.</h3><p>Annual simple token rates grow exponentially from 1% for a 1-month lock to 10% for a 24-month lock. Total reward is annual rate × months / 12: 20% for 24 months. The full term reward is escrowed. There is no new minting.</p>
        <p>Early-exit fee = 5% × the fraction of the term remaining. It reaches zero at maturity. Of the fee, 50% is queued for permissionless burning, 40% goes to Community programs and 10% to the V1PR Foundation. Only completed program months earn rewards, at the rate for that completed length.</p>
        <div id="claim-action" className="claim-action"><h3>FREE CLAIM STATUS</h3><p className="fine-print">{launch.freeClaimsStartMs > 0 ? `UTC window: ${new Date(launch.freeClaimsStartMs).toISOString()} → ${new Date(launch.freeClaimsStartMs + 14 * 86400000).toISOString()} · ${freeOpen ? 'OPEN' : 'NOT OPEN'}` : 'Opening date not announced. Free claims are closed.'}</p><p>Free claims require an approved address: one 10,000 V1PR claim per approved wallet during the 14-day scheduled window. Approvals freeze at opening; unclaimed tokens can be burned after the deadline.</p><button className="button outline" disabled={!freeOpen || !account || !vault || pending} onClick={() => void submit('claim')}>CLAIM 10,000 V1PR</button></div>
        <p className="fine-print">{configured ? `Network: ${launch.network}. Wallet approval is required for every transaction.` : 'Contracts are implemented locally. Transactions remain disabled until deployment records and verified object IDs are published.'}</p>
        <a className="text-link" href={siteUrl('whitepaper/')}>READ THE WHITE PAPER ↗</a> · <a className="text-link" href={siteUrl('whitepaper/')} target="_blank" rel="noreferrer">JOURNAL PDF ↗</a>
      </div>
    </div>
    {visiblePositions.length > 0 && <div className="positions"><h3>YOUR LOCKS</h3>{visiblePositions.map((position) => {
      const quote = exitPreview(BigInt(position.principal), BigInt(position.reward), BigInt(position.duration_ms), chainTime - BigInt(position.start_ms));
      return <article className="lock-card" key={position.id}><p>{formatAmount(BigInt(position.principal))} V1PR · {Number(BigInt(position.duration_ms) / MONTH_MS)} months</p><p><ExplorerLink kind="object" value={position.id}>View position</ExplorerLink></p><p>Matures {new Date(Number(BigInt(position.start_ms) + BigInt(position.duration_ms))).toLocaleString()}</p><p>Earned {formatAmount(quote.earned)} · Fee {formatAmount(quote.fee)} V1PR</p><p>Community {formatAmount(quote.community)} · Pending burn {formatAmount(quote.burn)} · Foundation {formatAmount(quote.founder)}</p><p>Net payout: {formatAmount(quote.net)} V1PR</p><p className="fine-print">Preview uses the last fetched onchain clock. The transaction uses the current onchain time.</p><button className="button outline" disabled={pending || !vault} onClick={() => void submit('withdraw', position)}>WITHDRAW</button></article>;
    })}<button className="button outline" disabled={pending} onClick={() => setRevision((value) => value + 1)}>REFRESH PREVIEW</button></div>}
    {error && <p role="alert" className="transaction-message">{error}</p>}{message && <p role="status" className="transaction-message">Confirmed: <ExplorerLink kind="tx" value={message}>{message}</ExplorerLink></p>}
  </section>;
}
