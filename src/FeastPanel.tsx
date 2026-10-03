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
import accepted from '../scripts/feast/config.json';
import { addressValid, networks, bindingMessage, lockMessage, type SourceChain } from '../scripts/feast/networks.mjs';

interface EthereumProvider { request(input: { method: string; params?: unknown[] }): Promise<unknown>; }
interface SolanaProvider { connect(): Promise<{ publicKey: { toString(): string } }>; signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>; }
export default function FeastPanel() {
  const account = useCurrentAccount(), client = useCurrentClient(), kit = useDAppKit();
  const [consent, setConsent] = useState(false), [months, setMonths] = useState(0), [chain, setChain] = useState<SourceChain>('ethereum');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(''), [binding, setBinding] = useState('');
  const [dogeSource, setDogeSource] = useState(''), [dogeSignature, setDogeSignature] = useState(''), [dogeLockSignature, setDogeLockSignature] = useState('');
  const windowStart = launch.feastStartMs / 1000;
  const dogeMessage = account && addressValid('dogecoin',dogeSource) && windowStart > 0 ? bindingMessage(dogeSource,account.address,'dogecoin',windowStart) : '';
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
      if (chain === 'ethereum' || chain === 'memecore') {
        const provider = wallets.ethereum; if (!provider) throw new Error('Install an Ethereum wallet supporting personal_sign.');
        const network = await provider.request({ method: 'eth_chainId' });
        if (network !== networks[chain].chainId) throw new Error(`Switch your source wallet to ${networks[chain].label} mainnet before signing.`);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') throw new Error('Wallet returned no Ethereum account.');
        source = accounts[0]; if (!treasuryAddressValid(chain, source)) throw new Error('Invalid source account.');
        const message = bindingMessage(source,account.address,chain,windowStart);
        const sign = async (text: string) => {
          const hex = '0x' + [...new TextEncoder().encode(text)].map(n => n.toString(16).padStart(2, '0')).join('');
          const result = await provider.request({ method: 'personal_sign', params: [hex, source] });
          if (typeof result !== 'string') throw new Error('Wallet returned an invalid signature.'); return result;
        };
        signature = await sign(message); lockSignature = await sign(lockMessage(message,months));
      } else if (chain === 'solana') {
        const provider = wallets.solana; if (!provider) throw new Error('Install a Solana wallet supporting signMessage.');
        source = (await provider.connect()).publicKey.toString(); if (!treasuryAddressValid(chain, source)) throw new Error('Invalid source account.');
        const message = bindingMessage(source,account.address,chain,windowStart);
        signature = toBase58((await provider.signMessage(new TextEncoder().encode(message), 'utf8')).signature);
        lockSignature = toBase58((await provider.signMessage(new TextEncoder().encode(lockMessage(message,months)), 'utf8')).signature);
      }
      else {
        source = dogeSource;
        if (!addressValid('dogecoin',source) || !/^[A-Za-z0-9+/]{87}=$/.test(dogeSignature) || !/^[A-Za-z0-9+/]{87}=$/.test(dogeLockSignature)) throw new Error('Enter a native Dogecoin P2PKH address and both compact Base64 signatures.');
        signature = dogeSignature; lockSignature = dogeLockSignature;
      }
      setBinding(JSON.stringify({ chain, windowStart, source, sui: account.address, lockMonths: months, message: bindingMessage(source,account.address,chain,windowStart), signature, lockSignature }, null, 2));
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
    <div className="feast-status"><span className="status-label">{campaignOpen ? 'CAMPAIGN CONFIGURED' : 'CONTRIBUTIONS CLOSED'}</span><span>21-day window · 100 million V1PR allocation pool</span></div>
    <div className="feast-steps">{[
      ['01', 'Bind your wallets', 'Sign with your source wallet on its accepted network, choose your Sui destination and allocation term. Submit the receipt and confirm acceptance before transferring.'],
      ['02', 'Feed the Viper', 'Contribute an accepted meme coin during the published window. Eligible USD value, timing and lock choice determine your share of allocation points.'],
      ['03', 'Claim on Sui', 'Allocations freeze at finalization. Choose liquid vesting or the recorded lock. Claim within 90 days; network gas applies.'],
    ].map(([n,title,text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    <div className="menu-board"><div className="kicker">ON THE MENU / EXACT NETWORKS & ASSETS</div>{(Object.keys(networks) as SourceChain[]).map(source => <div key={source}><span>{networks[source].label}</span><p>{accepted.coins.filter(c => c.chain === source).map(c => <a key={c.id} href={c.contract === 'native' ? c.assetSource : `${source === 'ethereum' ? 'https://etherscan.io/token/' : 'https://solscan.io/token/'}${c.contract}`} target="_blank" rel="noreferrer">{c.symbol}{c.contract === 'native' ? ' · native' : ''} ↗</a>)}</p></div>)}</div>
    <div className="feast-choices"><article><span>LIQUID</span><strong>1.00×</strong><p>50% immediately; 50% vests linearly over 60 days.</p></article><article><span>12-MONTH LOCK</span><strong>1.10×</strong><p>Allocation points bonus; a 12-month reward-bearing lock at claim.</p></article><article><span>24-MONTH LOCK</span><strong>1.25×</strong><p>Allocation points bonus; a 24-month reward-bearing lock at claim.</p></article></div>
    <details className="info-detail"><summary>Timing, valuation and allocation rules</summary><div><p>Days 1–5 earn 1.50× points. The timing bonus declines in daily steps to 1.00× on day 19 and stays there through day 21. It multiplies eligible USD value and your allocation-choice bonus; these are allocation points, not guaranteed returns.</p><p>Contribution value is the lower of Pyth confirmation-time spot and the preceding 1,440 one-minute average. Missing, stale or future prices stop scoring. Allocations are proportional to total points, capped at 10,000 V1PR per eligible USD before bonuses, with no wallet cap. Unallocated inventory is burned at finalization.</p><p>Publish finalized receipts, price archives, allocation CSV, SHA-256 hash and scoring commit. All source wallets bound to the same Sui destination must choose the same term. Ethereum and MemeCore use EOA personal-sign signatures; Solana uses Ed25519. Native DOGE uses Dogecoin compact signatures from a P2PKH wallet, imported manually. Contract-wallet signatures and mixed-source DOGE inputs are unsupported. Signatures include the source network and campaign start to prevent reuse across campaigns.</p></div></details>
    <details className="info-detail"><summary>Proceeds, liquidity and claim conditions</summary><div><p>{FEAST_DISCLOSURE}</p><p>25% of proceeds is committed to exchange liquidity. The opening DEX price must be no lower than the Feast clearing price. Cross-chain funding is an operating commitment, not automatically enforced by the Sui contract.</p><p>Locked Feast claims require full available reward capacity and unpaused deposits. A binding does not reserve rewards. If the allocation remains unclaimable until the 90-day expiry, it can be burned. There is no contribution refund path. The lock begins at claim time.</p><p>The site does not automatically submit bindings or transfer contributed coins. Binding signatures publicly link source and destination wallets; reading this page does not open a campaign.</p></div></details>
    <p className="fine-print">{campaignOpen ? 'The contribution window and immutable contracts are checked again before signing.' : 'The Feast is in preparation. Contributions and source-wallet binding are closed.'} <a href={siteUrl('whitepaper/')}>Read the complete Feast specification ↗</a></p>
    {campaignOpen && <div className="lock-card"><h3>FEAST PROCEEDS</h3><p>{FEAST_DISCLOSURE}</p><p>The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are discretionary V1PR Foundation funds.</p><p>Signing links your source wallet publicly to your Sui destination. No transfer is requested by this signature. Download the signed receipt, submit through the published channel and confirm acceptance before transferring. The site does not automatically submit bindings or send contributed coins.</p><p>Locked Feast allocations compete for vault reward capacity. A signed lock choice does not reserve rewards. If capacity stays unavailable through the 90-day claim window, the unclaimed allocation can be burned; contributed coins are not refunded.</p><ConnectButton />
      <label htmlFor="feast-chain">Source chain</label><select id="feast-chain" value={chain} onChange={e => { setChain(e.target.value as typeof chain); setBinding(''); setDogeSignature(''); setDogeLockSignature(''); }}>{(Object.keys(networks) as SourceChain[]).map(n => <option key={n} value={n}>{networks[n].label}</option>)}</select>
      <label htmlFor="feast-term">Allocation choice</label><select id="feast-term" value={months} onChange={e => { setMonths(Number(e.target.value)); setBinding(''); setDogeSignature(''); setDogeLockSignature(''); }}><option value="0">Liquid · 1.00× points · 50% now / 50% over 60 days</option><option value="12">12-month lock · 1.10× points</option><option value="24">24-month lock · 1.25× points</option></select>
      {chain === 'dogecoin' && <div className="doge-binding"><label htmlFor="doge-source">Native DOGE source address (P2PKH)</label><input id="doge-source" value={dogeSource} onChange={e=>{setDogeSource(e.target.value.trim());setBinding('');setDogeSignature('');setDogeLockSignature('');}} />
        <p>Use your Dogecoin wallet's message-signing tool to sign both exact texts below. Paste the Base64 signatures; never enter a private key or seed. The scorer verifies these signatures before acceptance.</p>
        <label htmlFor="doge-binding-text">Wallet binding text</label><textarea id="doge-binding-text" readOnly value={dogeMessage} />
        <label htmlFor="doge-signature">Binding signature</label><textarea id="doge-signature" value={dogeSignature} onChange={e=>{setDogeSignature(e.target.value.trim());setBinding('');}} />
        <label htmlFor="doge-lock-text">Lock choice text</label><textarea id="doge-lock-text" readOnly value={dogeMessage ? lockMessage(dogeMessage,months) : ''} />
        <label htmlFor="doge-lock-signature">Lock choice signature</label><textarea id="doge-lock-signature" value={dogeLockSignature} onChange={e=>{setDogeLockSignature(e.target.value.trim());setBinding('');}} />
      </div>}
      <p>V1PR Foundation receiving wallet (founder-controlled): {treasuryExplorer(chain, launch.feastTreasury[chain]) && <a href={treasuryExplorer(chain, launch.feastTreasury[chain])!} target="_blank" rel="noreferrer">{launch.feastTreasury[chain]} ↗</a>}</p>
      <label><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setBinding(''); }} /> I understand and accept the Feast proceeds disclosure and public wallet linkage.</label>
      <button className="button lime" disabled={!consent || !account || busy} onClick={() => void signBinding()}>{chain === 'dogecoin' ? 'PREPARE DOGE BINDING RECEIPT' : 'SIGN WALLET BINDING'}</button>
      {binding && <><pre className="coin-type">{binding}</pre><button className="button outline" onClick={download}>DOWNLOAD SIGNED BINDING</button><p><a href={launch.feastSubmissionUrl} target="_blank" rel="noreferrer">Official binding submission instructions ↗</a></p></>}
    </div>}
    {isLaunchConfigured && <div className="lock-card"><h3>CLAIM YOUR FINALIZED FEAST ALLOCATION</h3><ConnectButton /><p>Liquid claims release vested inventory. Locked claims open your recorded 12/24-month lock; the reward vault must have full capacity. Claims end 90 days after finalization.</p><button className="button outline" disabled={!account || busy} onClick={() => void claim()}>CLAIM V1PR</button></div>}
    {error && <p role="alert" className="transaction-message">{error}</p>}{receipt && <p role="status">Claim confirmed: <ExplorerLink kind="tx" value={receipt}>{receipt}</ExplorerLink></p>}
  </section>;
}
