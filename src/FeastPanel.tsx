import { useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { toBase58 } from '@mysten/sui/utils';
import { launch, isLaunchConfigured } from './manifest';
import { readChainState, objectAbsent } from './chainState';
import { FeastAllocationBcs } from './chainSchemas';
import { FEAST_DISCLOSURE, treasuryExplorer, treasuryAddressValid } from './feastData';
import ExplorerLink from './ExplorerLink';
import { siteUrl } from './site';

interface EthereumProvider { request(input: { method: string; params?: unknown[] }): Promise<unknown>; }
interface SolanaProvider { connect(): Promise<{ publicKey: { toString(): string } }>; signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>; }
export default function FeastPanel() {
  const account = useCurrentAccount(), client = useCurrentClient(), kit = useDAppKit();
  const [consent, setConsent] = useState(false), [months, setMonths] = useState(0), [chain, setChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(''), [binding, setBinding] = useState('');
  const campaignOpen = isLaunchConfigured && launch.feastOpen;
  async function signBinding() {
    if (!campaignOpen || !consent || !account || busy) return;
    setBusy(true); setError(''); setBinding('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw new Error('Connect a Sui wallet on the configured network.');
      if (state.f.finalized) throw new Error('Feast contributions have closed.');
      if (state.time < BigInt(launch.feastStartMs) || state.time >= BigInt(launch.feastStartMs) + 21n * 86_400_000n) throw new Error('The 21-day contribution window is not open.');
      const wallets = window as Window & { ethereum?: EthereumProvider; solana?: SolanaProvider };
      let source: string, signature: string, lockSignature: string;
      if (chain === 'ethereum') {
        const provider = wallets.ethereum; if (!provider) throw new Error('Install an Ethereum wallet supporting personal_sign.');
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') throw new Error('Wallet returned no Ethereum account.');
        source = accounts[0]; if (!treasuryAddressValid(chain, source)) throw new Error('Invalid source account.');
        const message = `Bind ${source} to Sui ${account.address} for the V1PR Feast`;
        const sign = async (text: string) => {
          const hex = '0x' + [...new TextEncoder().encode(text)].map(n => n.toString(16).padStart(2, '0')).join('');
          const result = await provider.request({ method: 'personal_sign', params: [hex, source] });
          if (typeof result !== 'string') throw new Error('Wallet returned an invalid signature.'); return result;
        };
        signature = await sign(message); lockSignature = await sign(`${message}\nLock choice: ${months} months`);
      } else {
        const provider = wallets.solana; if (!provider) throw new Error('Install a Solana wallet supporting signMessage.');
        source = (await provider.connect()).publicKey.toString(); if (!treasuryAddressValid(chain, source)) throw new Error('Invalid source account.');
        const message = `Bind ${source} to Sui ${account.address} for the V1PR Feast`;
        signature = toBase58((await provider.signMessage(new TextEncoder().encode(message), 'utf8')).signature);
        lockSignature = toBase58((await provider.signMessage(new TextEncoder().encode(`${message}\nLock choice: ${months} months`), 'utf8')).signature);
      }
      setBinding(JSON.stringify({ chain, source, sui: account.address, lockMonths: months, message: `Bind ${source} to Sui ${account.address} for the V1PR Feast`, signature, lockSignature }, null, 2));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function claim() {
    if (!isLaunchConfigured || !account || busy) return;
    setBusy(true); setError(''); setReceipt('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw new Error('Connect a wallet on the configured Sui network.');
      if (!state.f.finalized || state.time >= BigInt(state.f.start_ms) + 90n * 86_400_000n) throw new Error('Feast claims are not open.');
      let a: ReturnType<typeof FeastAllocationBcs.parse>;
      try {
        const result = await client.core.getDynamicField({ parentId: state.f.allocations.id, name: { type: 'address', bcs: bcs.Address.serialize(account.address).toBytes() }, signal: AbortSignal.timeout(20_000) });
        a = FeastAllocationBcs.parse(result.dynamicField.value.bcs);
      } catch (e) {
        if (objectAbsent(e)) throw new Error('This wallet has no approved Feast allocation.');
        throw new Error('Network or data error: Feast eligibility could not be verified.');
      }
      const tx = new Transaction(); tx.setSender(account.address);
      tx.moveCall({ target: `${launch.packageId}::feast::${a.lock_months === '0' ? 'claim' : 'claim_locked'}`, arguments: a.lock_months === '0' ? [tx.object(launch.feastId), tx.object('0x6')] : [tx.object(launch.feastId), tx.object(launch.vaultId), tx.object('0x6')] });
      const result = await kit.signAndExecuteTransaction({ transaction: tx });
      if (result.FailedTransaction) throw new Error(result.FailedTransaction.status.error?.message ?? 'Claim failed.');
      await client.core.waitForTransaction({ digest: result.Transaction.digest }); setReceipt(result.Transaction.digest);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([binding + '\n'], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'v1pr-feast-binding.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <section id="feast" className="section feast-section"><div className="kicker">THE FEAST / FEED THE VIPER</div><h2>CUTE MEMES.<br/><em>MORE VENOM.</em></h2>
    <p className="token-intro">Babies grow fastest when you feed them. Our baby Viper has an appetite: cute, cuddly meme coins are on the menu. Feed the Viper. Fuel the community. Bring more bite to the jungle.</p>
    <p>“Venom” means participation and momentum. The Feast exchanges accepted meme coins for a share of 100 million V1PR, with more allocation points for earlier participation and longer commitments. The ambition is growth and upside; token rewards, burns and feeding cannot guarantee price gains.</p>
    <p className="fine-print">{campaignOpen ? 'Campaign configured. The contribution window and immutable contracts are checked again before signing.' : 'The Feast is in preparation. Contributions and source-wallet binding are closed.'} <a href={siteUrl('whitepaper/')}>Read the allocation and vesting rules ↗</a></p>
    {campaignOpen && <div className="lock-card"><h3>FEAST PROCEEDS</h3><p>{FEAST_DISCLOSURE}</p><p>The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary.</p><p>Signing links your source wallet publicly to your Sui destination. No transfer is requested by this signature. Download the signed receipt, submit through the published channel and confirm acceptance before transferring. The site does not automatically submit bindings or send contributed coins.</p><p>Locked Feast allocations compete for vault reward capacity. A signed lock choice does not reserve rewards. If capacity stays unavailable through the 90-day claim window, the unclaimed allocation can be burned; contributed coins are not refunded.</p><ConnectButton />
      <label htmlFor="feast-chain">Source chain</label><select id="feast-chain" value={chain} onChange={e => { setChain(e.target.value as typeof chain); setBinding(''); }}><option value="ethereum">Ethereum</option><option value="solana">Solana</option></select>
      <label htmlFor="feast-term">Allocation choice</label><select id="feast-term" value={months} onChange={e => { setMonths(Number(e.target.value)); setBinding(''); }}><option value="0">Liquid · 1.00× points · 50% now / 50% over 60 days</option><option value="12">12-month lock · 1.10× points</option><option value="24">24-month lock · 1.25× points</option></select>
      <p>V1PR Treasury (founder-controlled): {treasuryExplorer(chain, launch.feastTreasury[chain]) && <a href={treasuryExplorer(chain, launch.feastTreasury[chain])!} target="_blank" rel="noreferrer">{launch.feastTreasury[chain]} ↗</a>}</p>
      <label><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setBinding(''); }} /> I understand and accept the Feast proceeds disclosure and public wallet linkage.</label>
      <button className="button lime" disabled={!consent || !account || busy} onClick={() => void signBinding()}>SIGN WALLET BINDING</button>
      {binding && <><pre className="coin-type">{binding}</pre><button className="button outline" onClick={download}>DOWNLOAD SIGNED BINDING</button><p><a href={launch.feastSubmissionUrl} target="_blank" rel="noreferrer">Official binding submission instructions ↗</a></p></>}
    </div>}
    {isLaunchConfigured && <div className="lock-card"><h3>CLAIM YOUR FINALIZED FEAST ALLOCATION</h3><ConnectButton /><p>Liquid claims release vested inventory. Locked claims open your recorded 12/24-month lock; the reward vault must have full capacity. Claims end 90 days after finalization.</p><button className="button outline" disabled={!account || busy} onClick={() => void claim()}>CLAIM V1PR</button></div>}
    {error && <p role="alert" className="transaction-message">{error}</p>}{receipt && <p role="status">Claim confirmed: <ExplorerLink kind="tx" value={receipt}>{receipt}</ExplorerLink></p>}
  </section>;
}
