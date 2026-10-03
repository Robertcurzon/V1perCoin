import {normalizeAddress,assetKey} from './networks.mjs';
export const FINALITY_RULES=Object.freeze({ethereum:'finalized-block',solana:'finalized-slot',dogecoin:'60-confirmations',memecore:'finalized-block'});
export function requireFinality(t) {
  if(t.finalityRule!==FINALITY_RULES[t.chain]) throw Error('Missing or incorrect source finality rule');
  if(t.chain==='dogecoin') {
    if(!Number.isSafeInteger(t.confirmations)||t.confirmations<60) throw Error('DOGE needs at least 60 confirmations');
  } else {
    if(t.finalized!==true || t.receiptStatus!=='success') throw Error('Unfinalized or unsuccessful receipt');
    const position=t.chain==='solana'?t.slot:t.blockNumber;
    const anchor=t.chain==='solana'?t.finalizedSlot:t.finalizedBlockNumber;
    if(!Number.isSafeInteger(position)||position<0||!Number.isSafeInteger(anchor)||anchor<position) throw Error('Receipt is beyond its finalized anchor');
    if(t.chain==='solana' && t.commitment!=='finalized') throw Error('Solana requires finalized commitment');
    if(t.chain==='ethereum' && t.chainId!==1) throw Error('Ethereum mainnet chain ID required');
    if(t.chain==='memecore' && t.chainId!==4352) throw Error('MemeCore mainnet chain ID required');
  }
}
function unsigned(value) {
  if(typeof value!=='string'||!/^(0|[1-9][0-9]*)$/.test(value))throw Error('Reconciliation amounts must be canonical unsigned base-unit strings');
  return BigInt(value);
}
function provenance(source) {
  if(!source || typeof source.provider!=='string' || !source.provider.trim() || typeof source.datasetId!=='string' || !source.datasetId.trim() || !/^[a-f0-9]{64}$/.test(source.evidenceSha256) || !Number.isSafeInteger(source.exportedAt) || source.exportedAt<=0) throw Error('Missing provider, dataset, evidence hash or export timestamp');
}
export function reconcile(config,transfers,transferSource,independent) {
  provenance(transferSource); provenance(independent?.source);
  if(transferSource.provider.trim().toLowerCase()===independent.source.provider.trim().toLowerCase() || transferSource.datasetId===independent.source.datasetId || transferSource.evidenceSha256===independent.source.evidenceSha256) throw Error('Reconciliation requires a second independent provider and dataset');
  if(!Array.isArray(independent.records)) throw Error('Missing receiving-wallet balance records');
  const expected=new Map(config.coins.map(c=>[`${assetKey(c.chain,c.contract)}:${normalizeAddress(c.chain,c.treasury,true)}`,{coin:c,total:0n}]));
  for(const t of transfers) {
    if(t.confirmedAt<config.windowStart||t.confirmedAt>=config.windowStart+21*86400)continue;
    requireFinality(t);
    const key=`${assetKey(t.chain,t.contract)}:${normalizeAddress(t.chain,t.to,true)}`;
    const entry=expected.get(key); if(!entry)throw Error('Receipt does not reconcile to an accepted asset/wallet');
    entry.total+=unsigned(t.amountBaseUnits);
  }
  const seen=new Set(),results=[];
  for(const r of independent.records) {
    const key=`${assetKey(r.chain,r.contract)}:${normalizeAddress(r.chain,r.wallet,true)}`,entry=expected.get(key);
    if(!entry||seen.has(key))throw Error('Unexpected or duplicate reconciliation asset/wallet'); seen.add(key);
    if(r.windowStart!==config.windowStart || r.windowEnd!==config.windowStart+21*86400)throw Error('Reconciliation window mismatch');
    requireFinality(r.startAnchor);requireFinality(r.endAnchor);
    if(r.startAnchor.chain!==r.chain||r.endAnchor.chain!==r.chain)throw Error('Reconciliation anchor chain mismatch');
    if(typeof r.startAnchor.blockHash!=='string'||!r.startAnchor.blockHash || typeof r.endAnchor.blockHash!=='string'||!r.endAnchor.blockHash)throw Error('Balance snapshot anchor IDs required');
    const start=unsigned(r.startBalanceBaseUnits),end=unsigned(r.endBalanceBaseUnits),out=unsigned(r.outflowsBaseUnits);
    const inbound=end-start+out;
    if(inbound<0n || entry.total!==inbound)throw Error(`Reconciliation mismatch for ${entry.coin.id}: exported ${entry.total}, independent ${inbound}`);
    results.push({coin:entry.coin.id,chain:r.chain,wallet:r.wallet,exportedInboundBaseUnits:String(entry.total),startBalanceBaseUnits:String(start),endBalanceBaseUnits:String(end),outflowsBaseUnits:String(out),startAnchor:r.startAnchor,endAnchor:r.endAnchor});
  }
  if(seen.size!==expected.size)throw Error('Reconcile every accepted asset and wallet, including zero receipts');
  return {transferSource,independentSource:independent.source,records:results.sort((a,b)=>a.coin<b.coin?-1:a.coin>b.coin?1:0)};
}
