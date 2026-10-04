import { Wallet } from 'ethers';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bindingMessage,suiLockMessage,DAY,hash } from './score.mjs';
import { FINALITY_RULES } from './integrity.mjs';
export const treasury='0x'+'bc'.repeat(20),feed='ab'.repeat(32),start=1_000_000;
export const config={snapshotDate:'2026-10-03',snapshotSha256:'cc'.repeat(32),finalityRules:FINALITY_RULES,windowStart:start,bindingDeadline:start+23*DAY,liquidityProceedsPercent:25,coins:Array.from({length:10},(_,i)=>({id:`fixture${i}`,chain:'ethereum',contract:'0x'+(i+1).toString(16).padStart(40,'0'),decimals:6,pythFeed:feed,treasury}))};
export const wallets=Array.from({length:3},()=>Wallet.createRandom()),suiKeys=Array.from({length:3},()=>Ed25519Keypair.generate());
export async function binding(months=0,i=0,override={}) {
 const w=wallets[i],sui=suiKeys[i].toSuiAddress(),b={chain:'ethereum',windowStart:start,bindingDeadline:config.bindingDeadline,receivedAt:start,source:w.address,sui,lockMonths:months,...override};
 b.message=bindingMessage(b.source,b.sui,b.chain,start,b.bindingDeadline);b.signature=await w.signMessage(b.message);
 if(!override.sourceOnly) b.suiLockSignature=(await suiKeys[i].signPersonalMessage(new TextEncoder().encode(suiLockMessage(b.sui,months,start,b.bindingDeadline)))).signature;
 return b;
}
export function transfer(day=1,amount='1000000',i=0,index=0) {return {chain:'ethereum',finalityRule:'finalized-block',chainId:1,blockNumber:10,finalizedBlockNumber:20,finalized:true,receiptStatus:'success',contract:config.coins[0].contract,txHash:'0x'+(i+1).toString(16).padStart(64,'0'),index,from:wallets[i].address,to:treasury,confirmedAt:start+(day-1)*DAY,amountBaseUnits:String(amount)};}
export function archive(transfers,{price='100000000',expo=-8,average=price,feedId=feed}={}) {
 const rawArchive=[],prices={},seen=new Set();
 function o(time,p) {
  const observation={feedId,price:p,expo,publishTime:time},k=`${feedId}:${time}`;
  if(!seen.has(k)) {seen.add(k);const rawResponse=JSON.stringify({parsed:[{id:feedId,price:{price:p,expo,publish_time:time}}]});rawArchive.push({url:`https://benchmarks.pyth.network/v1/updates/price/${time-1}?ids=${feedId}`,rawResponse,sha256:hash(rawResponse)});}
  return observation;
 }
 for(const t of transfers) {
  prices[`${t.chain}:${t.chain==='solana'?t.txHash:t.txHash.toLowerCase()}:${t.index}`]={provider:'Pyth Benchmarks',confirmedAt:t.confirmedAt,spot:o(t.confirmedAt,price),history:Array.from({length:1440},(_,i)=>o(t.confirmedAt-(i+1)*60,average))};
 }
 return {prices,rawArchive};
}
export const transferSource={provider:'primary',datasetId:'inbound',evidenceSha256:'11'.repeat(32),exportedAt:start+24*DAY};
export function evidence(transfers,outflows=[],cfg=config) {
 return {transferSource,independent:{source:{provider:'independent',datasetId:'balances-outflows',evidenceSha256:'22'.repeat(32),exportedAt:start+24*DAY},records:cfg.coins.map(c=>{
  const ts=transfers.filter(t=>t.chain===c.chain&&t.contract===c.contract&&t.confirmedAt>=cfg.windowStart&&t.confirmedAt<cfg.windowStart+21*DAY),out=outflows.filter(o=>o.coin===c.id);
  const inbound=ts.reduce((n,t)=>n+BigInt(t.amountBaseUnits),0n),returned=out.reduce((n,o)=>n+BigInt(o.amountBaseUnits),0n),balance=returned>inbound?returned:inbound;
  const anchor={chain:c.chain,finalityRule:FINALITY_RULES[c.chain],finalized:true,receiptStatus:'success',chainId:c.chain==='memecore'?4352:1,blockNumber:10,finalizedBlockNumber:20,slot:10,finalizedSlot:20,commitment:'finalized',confirmations:60};
  return {chain:c.chain,contract:c.contract,wallet:c.treasury,windowStart:cfg.windowStart,windowEnd:cfg.windowStart+21*DAY,startBalanceBaseUnits:String(balance),endBalanceBaseUnits:String(balance+inbound-returned),outflows:out.map(({coin,...o})=>o),startAnchor:{...anchor,blockHash:'01'.repeat(32),timestamp:cfg.windowStart-1},endAnchor:{...anchor,blockHash:'02'.repeat(32),timestamp:cfg.windowStart+21*DAY}};
 })}};
}
