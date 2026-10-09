import FeastMenu from './FeastMenu';
import { V1per, BrandText } from './V1per';
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
import { addressValid, networks, bindingMessage, suiLockMessage, type SourceChain } from '../scripts/feast/networks.mjs';

interface EthereumProvider { request(input: { method: string; params?: unknown[] }): Promise<unknown>; }
interface SolanaProvider { connect(): Promise<{ publicKey: { toString(): string } }>; signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>; }
export default function FeastPanel({ detailed = false }: { detailed?: boolean }) {
  const account = useCurrentAccount(), client = useCurrentClient(), kit = useDAppKit();
  const [consent, setConsent] = useState(false), [months, setMonths] = useState(0), [chain, setChain] = useState<SourceChain>('ethereum');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(''), [binding, setBinding] = useState('');
  const [dogeSource, setDogeSource] = useState(''), [dogeSignature, setDogeSignature] = useState('');
  const windowStart = launch.feastStartMs / 1000;
  const dogeMessage = account && addressValid('dogecoin',dogeSource) && windowStart > 0 ? bindingMessage(dogeSource,account.address,'dogecoin',windowStart) : '';
  const campaignOpen = isLaunchConfigured && launch.feastOpen;
  async function signBinding() {
    if (!campaignOpen || !consent || !account || busy) return;
    setBusy(true); setError(''); setBinding('');
    try {
      const state = await readChainState(client);
      if (!account.chains.includes(`sui:${launch.network}`)) throw new Error('Connect a Sui wallet on the configured network.');
      if (state.f.finalized || state.f.abandoned) throw new Error('Feast contributions have closed.');
      if (state.time < BigInt(launch.feastStartMs) || state.time >= BigInt(launch.feastStartMs) + 23n * 86_400_000n) throw new Error('Wallet binding is closed; deadline is 48 hours after the contribution window.');
      const wallets = window as Window & { ethereum?: EthereumProvider; solana?: SolanaProvider };
      let source: string, signature: string;
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
        signature = await sign(message);
      } else if (chain === 'solana') {
        const provider = wallets.solana; if (!provider) throw new Error('Install a Solana wallet supporting signMessage.');
        source = (await provider.connect()).publicKey.toString(); if (!treasuryAddressValid(chain, source)) throw new Error('Invalid source account.');
        const message = bindingMessage(source,account.address,chain,windowStart);
        signature = toBase58((await provider.signMessage(new TextEncoder().encode(message), 'utf8')).signature);
      }
      else {
        source = dogeSource;
        if (!addressValid('dogecoin',source) || !/^[A-Za-z0-9+/]{87}=$/.test(dogeSignature)) throw new Error('Enter a native Dogecoin P2PKH address and a compact Base64 signature.');
        signature = dogeSignature;
      }
      const bindingDeadline=launch.feastBindingDeadlineMs/1000;
      const signed=await kit.signPersonalMessage({message:new TextEncoder().encode(suiLockMessage(account.address,months,windowStart,bindingDeadline))});
      setBinding(JSON.stringify({ chain, windowStart, bindingDeadline, source, sui: account.address, lockMonths: months, message: bindingMessage(source,account.address,chain,windowStart,bindingDeadline), signature, suiLockSignature:signed.signature }, null, 2));
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
    const a = document.createElement('a'); a.href = url; a.download = 'v1per-feast-binding.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <section id="feast" className="section feast-section"><div className="art-intro"><div className="intro-copy">{detailed ? <><div className="kicker">THE FEAST / FEED THE VIPER</div><h2>THE FEAST,<br/><em>STEP BY STEP.</em></h2></> : <h2>FEED THE VIPER.</h2>}
    <p className="token-intro">Contribute accepted meme coins for a <V1per /> allocation on Sui.</p><p className="feast-tagline">Cute had its turn. Feed the Viper.</p></div>
    <FeastMenu /></div>
<div className="feast-status"><span className="status-label">{campaignOpen ? 'CAMPAIGN CONFIGURED' : 'CONTRIBUTIONS CLOSED'}</span><span>21-day window · 100 million <V1per /> allocation pool</span></div>
    <div className="feast-steps">{[
      ['01', 'Link your wallets', 'Sign with your source wallet on its accepted network, choose your Sui destination and allocation term. The source signs the binding; the Sui wallet signs the term. Submit and confirm acceptance before transferring.'],
      ['02', 'Feed the Viper', 'Contribute an accepted meme coin during the published window. Eligible USD value, timing and lock choice determine your share of allocation points.'],
      ['03', 'Claim on Sui', 'Allocations freeze at finalization. Choose liquid vesting or the recorded lock. Claim within 90 days; network gas applies.'],
    ].map(([n,title,text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{detailed ? text : ({'01': 'Sign with your source and Sui wallets, then submit the file.', '02': 'After acceptance, send eligible coins during the 21-day window.', '03': 'Claim your finalized allocation on Sui.'}[n])}</p></article>)}</div>
    <details className="info-detail"><summary>Accepted coins and networks</summary><div className="menu-board"><div className="kicker">ON THE MENU / EXACT NETWORKS & ASSETS</div>{(Object.keys(networks) as SourceChain[]).map(source => <div key={source}><span>{networks[source].label}</span><p>{accepted.coins.filter(c => c.chain === source).map(c => <a key={c.id} href={c.contract === 'native' ? c.assetSource : `${source === 'ethereum' ? 'https://etherscan.io/token/' : 'https://solscan.io/token/'}${c.contract}`} target="_blank" rel="noreferrer">{c.symbol}{c.contract === 'native' ? ' · native' : ''} ↗</a>)}</p></div>)}</div></details>
    <div className="feast-choices"><article><span>CLAIM IN STAGES</span><strong>No lock bonus</strong><p>50% at finalization; the rest becomes available over 60 days.</p></article><article><span>12-MONTH LOCK</span><strong>10% allocation bonus</strong><p>Your tokens enter a 12-month lock when claimed, with its reward reserved.</p></article><article><span>24-MONTH LOCK</span><strong>25% allocation bonus</strong><p>Your tokens enter a 24-month lock when claimed, with its reward reserved.</p></article></div>
    {detailed && <><details className="info-detail"><summary>Timing, valuation and allocation rules</summary><div><p>Days 1–5 earn 1.50× points. The timing bonus declines in daily steps to 1.00× on day 19 and stays there through day 21. It multiplies eligible USD value and your allocation-choice bonus; these are allocation points, not guaranteed returns.</p><p>Contribution value is the lower of Pyth confirmation-time spot and the preceding 1,440 one-minute average. Missing, stale or future prices stop scoring. Calculate a base quantity at 10,000 <V1per /> per eligible USD, then apply timing and lock bonuses. If total bonus-weighted quantities exceed 100 million, reduce them proportionally. No wallet cap applies. Unallocated inventory is burned at finalization.</p><p>Publish finalized receipts, itemized receiving-wallet outflows, price archives, allocation CSV, file hash, on-chain allocation commitment and scoring commit. Only the destination Sui wallet can authorize a lock term through a personal-message signature. Source-only choices default to liquid. Conflicting Sui-signed choices resolve to liquid and are reported. Ethereum and MemeCore use EOA personal-sign signatures; Solana uses Ed25519. Native DOGE uses Dogecoin compact signatures from a P2PKH wallet, imported manually. Contract-wallet signatures and mixed-source DOGE inputs are unsupported. Bindings include the campaign start and a deadline 48 hours after contributions close. Submit before that deadline and confirm acceptance. Returned receiving-wallet funds are netted out before scoring; receiving wallets cannot earn allocations.</p></div></details>
    <details className="info-detail"><summary>Proceeds, liquidity and claim conditions</summary><div><p><BrandText text={FEAST_DISCLOSURE} /></p><p>25% of proceeds is committed to exchange liquidity. The opening DEX price must be no lower than the Feast clearing price. Cross-chain funding is an operating commitment, not automatically enforced by the Sui contract.</p><p>Finalization reserves the full reward for every locked Feast allocation or aborts. Reserved claims bypass emergency deposit pauses and the ordinary opening date. Unclaimed allocations and their reservations expire after 90 days. There is no contribution refund path. The lock begins at claim time.</p><p>The site does not automatically submit bindings or transfer contributed coins. Binding signatures publicly link source and destination wallets; reading this page does not open a campaign.</p></div></details>
    <p className="fine-print">{campaignOpen ? 'The contribution window and immutable contracts are checked again before signing.' : 'The Feast is in preparation. Contributions and source-wallet binding are closed.'} <a href={siteUrl('whitepaper/')}>Read the complete Feast specification ↗</a></p>
    </>}
    <p className="feast-disclosure">Contributed coins go to wallets controlled by the founder-run <V1per /> Foundation, to use at its discretion, with no refunds.</p><a className="text-link" href={siteUrl('rules/#feast')}>Full Feast rules →</a>
    {!campaignOpen && <div className="lock-card feast-action"><h3>Participate in the Feast</h3><p>Contributions are closed. The opening dates and receiving wallets will appear here when ready.</p><ConnectButton /><div className="buttons"><button className="button outline" disabled>FEAST NOT OPEN YET</button></div></div>}
    {campaignOpen && <div className="lock-card"><h3>Link your wallets for the Feast</h3>{detailed ? <><p><BrandText text={FEAST_DISCLOSURE} /></p><p>The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are discretionary <V1per /> Foundation funds.</p><p>Signing links your source wallet publicly to your Sui destination. No transfer is requested by this signature. Download the signed receipt, submit through the published channel and confirm acceptance before transferring. The site does not automatically submit bindings or send contributed coins.</p><p>A signed lock choice does not itself reserve rewards. Finalization must reserve the full reward for all locked allocations or abort. After finalization, your reservation survives deposit pauses and other users exhausting capacity. Claim within 90 days; expiry releases unused rewards and burns unclaimed principal. Contributions are not refunded.</p></> : <><p>Connect your Sui wallet, choose the network you are contributing from, and sign to link the two wallets. Download the signed file, submit it through the official channel and wait for acceptance before sending coins.</p><p>Signing does not transfer coins. It publicly links your wallets. A lock choice takes effect when you claim a finalized allocation.</p></>}<ConnectButton />
      <label htmlFor="feast-chain">Source chain</label><select id="feast-chain" value={chain} onChange={e => { setChain(e.target.value as typeof chain); setBinding(''); setDogeSignature(''); }}>{(Object.keys(networks) as SourceChain[]).map(n => <option key={n} value={n}>{networks[n].label}</option>)}</select>
      <label htmlFor="feast-term">Allocation choice</label><select id="feast-term" value={months} onChange={e => { setMonths(Number(e.target.value)); setBinding(''); setDogeSignature(''); }}><option value="0">Claim in stages · 50% at finalization / rest over 60 days</option><option value="12">12-month lock · 10% allocation bonus</option><option value="24">24-month lock · 25% allocation bonus</option></select>
      {chain === 'dogecoin' && <div className="doge-binding"><label htmlFor="doge-source">Native DOGE source address (P2PKH)</label><input id="doge-source" value={dogeSource} onChange={e=>{setDogeSource(e.target.value.trim());setBinding('');setDogeSignature('');}} />
        <p>Use your Dogecoin wallet's message-signing tool to sign the binding text below. Your connected Sui wallet separately authorizes the lock choice. Paste the Base64 signature below; never enter a private key or seed. The scorer verifies these signatures before acceptance.</p>
        <label htmlFor="doge-binding-text">Wallet binding text</label><textarea id="doge-binding-text" readOnly value={dogeMessage} />
        <label htmlFor="doge-signature">Binding signature</label><textarea id="doge-signature" value={dogeSignature} onChange={e=>{setDogeSignature(e.target.value.trim());setBinding('');}} />
      </div>}
      <p><V1per /> Foundation receiving wallet (founder-controlled): {treasuryExplorer(chain, launch.feastTreasury[chain]) && <a href={treasuryExplorer(chain, launch.feastTreasury[chain])!} target="_blank" rel="noreferrer">{launch.feastTreasury[chain]} ↗</a>}</p>
      <label><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setBinding(''); }} /> I understand and accept the Feast proceeds disclosure and public wallet linkage.</label>
      <button className="button lime" disabled={!consent || !account || busy} onClick={() => void signBinding()}>{chain === 'dogecoin' ? 'PREPARE DOGE BINDING RECEIPT' : 'SIGN TO LINK WALLETS'}</button>
      {binding && <><pre className="coin-type">{binding}</pre><button className="button outline" onClick={download}>DOWNLOAD SIGNED FILE</button><p><a href={launch.feastSubmissionUrl} target="_blank" rel="noreferrer">Submit your signed file ↗</a></p></>}
    </div>}
    {isLaunchConfigured && <div className="lock-card"><h3>CLAIM YOUR FINALIZED FEAST ALLOCATION</h3><ConnectButton /><p>Liquid claims release vested inventory. Locked claims open your recorded 12/24-month lock; its full reward was reserved at finalization. Claims end 90 days after finalization.</p><button className="button outline" disabled={!account || busy} onClick={() => void claim()}>CLAIM <V1per /></button></div>}
    {error && <p role="alert" className="transaction-message"><BrandText text={error} /></p>}{receipt && <p role="status">Claim confirmed: <ExplorerLink kind="tx" value={receipt}>{receipt}</ExplorerLink></p>}
  </section>;
}
