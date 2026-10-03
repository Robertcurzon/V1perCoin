import { useState } from 'react';
import { useCurrentAccount,useCurrentClient,useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { launch,isLaunchConfigured } from './manifest';
import { readChainState } from './chainState';
import { applicationMessage,entryUrl } from '../scripts/claims/messages.mjs';
export default function FreeClaimApplication() {
  const account=useCurrentAccount(),client=useCurrentClient(),kit=useDAppKit();
  const [entry,setEntry]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const configured=isLaunchConfigured && launch.freeClaimsStartMs>0 && /^https:\/\//.test(launch.freeClaimsApplicationUrl);
  async function sign() {
    if(!configured||!account||busy)return; setBusy(true);setError('');
    try {
      const state=await readChainState(client),start=BigInt(launch.freeClaimsStartMs);
      if(state.time<start-7n*86400000n||state.time>=start)throw Error('The seven-day application window is not open.');
      if(!account.chains.includes(`sui:${launch.network}`))throw Error('Connect a wallet on the configured Sui network.');
      const url=entryUrl(entry),text=applicationMessage(account.address.toLowerCase(),launch.freeClaimsStartMs,url);
      const signed=await kit.signPersonalMessage({message:new TextEncoder().encode(text)});
      const application={address:account.address.toLowerCase(),startMs:launch.freeClaimsStartMs,entryUrl:url,signature:signed.signature};
      const downloadUrl=URL.createObjectURL(new Blob([JSON.stringify(application,null,2)+'\n'],{type:'application/json'}));
      const a=document.createElement('a');a.href=downloadUrl;a.download='v1pr-free-claim-application.json';a.click();URL.revokeObjectURL(downloadUrl);
    } catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <details className="info-detail"><summary>Apply: eligibility, review and wallet proof</summary><div>
    <p>During the seven-day intake, submit one original meme, useful guide or valid testnet issue report with proof that you own the Sui destination. Reviewers check authorship, copied work and repeated entries. Accepted applications are ordered by the submission channel's recorded receipt time, with up to 10,000 distinct addresses admitted. Submitting does not guarantee approval.</p>
    <p>The published eligibility manifest records wallet proofs, reviewed-entry hashes, reasons and exclusions. The preparation tool deduplicates addresses, entry links and content hashes. Onchain approval rejects duplicate or zero addresses and more than 10,000 recipients. Approval freezes at day 0, and each address can claim only once before day 14. The window cannot be extended or reopened.</p>
    <p>One entry and one wallet are not proof of one human. Manual review reduces obvious farming but cannot eliminate multiple identities. No purchase, legal-name upload or paid referral is required. Submitted community entries and wallet proofs will be public.</p>
    {configured ? <><ConnectButton/><label htmlFor="claim-entry">Public HTTPS link to your original community entry</label><input id="claim-entry" value={entry} onChange={e=>setEntry(e.target.value)} /><button className="button outline" disabled={!account||busy||!entry} onClick={()=>void sign()}>{busy?'SIGNING…':'SIGN & DOWNLOAD APPLICATION'}</button><p>Submit the downloaded file through the <a href={launch.freeClaimsApplicationUrl} target="_blank" rel="noreferrer">official application channel ↗</a>. The channel records receipt time. This site does not submit the file or approve you automatically. This signature requests no token transfer.</p></> : <p className="fine-print">Applications are closed. The official submission channel and UTC dates will be published after verification; no application signature is requested yet.</p>}
    {error&&<p role="alert">{error}</p>}
  </div></details>;
}
