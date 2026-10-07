import { V1per, BrandText } from './V1per';
import { useEffect, useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { launch, isLaunchConfigured } from './manifest';
import { readChainState, objectAbsent } from './chainState';
import ExplorerLink from './ExplorerLink';

export default function FreeClaimAction() {
  const account = useCurrentAccount(), client = useCurrentClient(), kit = useDAppKit();
  const [chainTime, setChainTime] = useState(0n), [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  useEffect(() => {
    if (!isLaunchConfigured) return;
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const state = await readChainState(client, AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]));
        if (!controller.signal.aborted) { setChainTime(state.time); setReady(true); setError(''); }
      } catch (e) { if (!controller.signal.aborted) { setReady(false); setError((e as Error).message); } }
      finally { busy = false; }
    }
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [client]);
  async function claim() {
    if (!isLaunchConfigured || !account || !ready || pending) return;
    setPending(true); setError(''); setMessage('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw Error('Connected wallet does not support the configured network.');
      if (BigInt(state.p.end_ms) === 0n || state.time < BigInt(state.p.start_ms)) throw Error('The free-claim window is not open.');
      if (state.time >= BigInt(state.p.end_ms)) throw Error('The 14-day free-claim window has ended.');
      let claimed: boolean;
      try {
        const { dynamicField } = await client.core.getDynamicField({ parentId: state.p.eligibility.id, name: { type: 'address', bcs: bcs.Address.serialize(account.address).toBytes() }, signal: AbortSignal.timeout(20_000) });
        claimed = bcs.bool().parse(dynamicField.value.bcs);
      } catch (e) {
        if (objectAbsent(e)) throw Error('This wallet is not approved for a free claim.');
        throw Error('Network or data error: claim eligibility could not be verified. Please retry.');
      }
      if (claimed) throw Error('This wallet already claimed its allocation.');
      const tx = new Transaction(); tx.setSender(account.address);
      tx.moveCall({ target: `${launch.packageId}::free_claims::claim`, arguments: [tx.object(launch.claimsId), tx.object('0x6')] });
      const result = await kit.signAndExecuteTransaction({ transaction: tx });
      if (result.FailedTransaction) throw Error(result.FailedTransaction.status.error?.message ?? 'Transaction failed.');
      await client.core.waitForTransaction({ digest: result.Transaction.digest });
      setMessage(result.Transaction.digest);
    } catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  }
  const open = isLaunchConfigured && ready && launch.freeClaimsStartMs > 0 && chainTime >= BigInt(launch.freeClaimsStartMs) && chainTime < BigInt(launch.freeClaimsStartMs) + 14n * 86_400_000n;
  return <div id="claim-action" className="lock-card claim-action"><h3>CLAIM YOUR FREE TOKENS</h3><p>{launch.freeClaimsStartMs > 0 ? `UTC window: ${new Date(launch.freeClaimsStartMs).toISOString()} → ${new Date(launch.freeClaimsStartMs + 14 * 86400000).toISOString()} · ${open ? 'OPEN' : 'NOT OPEN'}` : 'Opening date not announced. Free claims are closed.'}</p><p>One 10,000 <V1per /> claim per approved wallet during the 14-day scheduled window; network gas only.</p><ConnectButton /><div className="buttons"><button className="button outline" disabled={!open || !account || pending} onClick={() => void claim()}><BrandText text={!isLaunchConfigured ? 'CLAIMS NOT OPEN YET' : pending ? 'PROCESSING…' : 'CLAIM 10,000 V1PER'} /></button></div>{error && <p role="alert"><BrandText text={error} /></p>}{message && <p role="status">Confirmed: <ExplorerLink kind="tx" value={message}><BrandText text={message} /></ExplorerLink></p>}</div>;
}
