import assert from 'node:assert/strict';
import { Wallet } from 'ethers';
import { ed25519 } from '@noble/curves/ed25519.js';
import { toBase58 } from '@mysten/sui/utils';
import { readFileSync } from 'node:fs';
import { score,verifyBinding,bindingMessage,lockMessage,earlyMultiplier,lockMultiplier,priceAt,DAY,POOL,UNIT,hash } from './score.mjs';
// Deterministic test keys only. No production signing material is generated or stored.
const wallet=new Wallet('0x'+'11'.repeat(32)),sui='0x'+'aa'.repeat(32),treasury='0x'+'bb'.repeat(20),feed='ab'.repeat(32);
async function binding(months=0,destination=sui) {const message=bindingMessage(wallet.address,destination,'ethereum',config.windowStart);return {chain:'ethereum',windowStart:config.windowStart,source:wallet.address,sui:destination,lockMonths:months,message,signature:await wallet.signMessage(message),lockSignature:await wallet.signMessage(lockMessage(message,months))};}
const config={snapshotDate:'2026-10-03',snapshotSha256:'cc'.repeat(32),windowStart:1_000_000,liquidityProceedsPercent:25,coins:Array.from({length:10},(_,i)=>({id:`fixture${i}`,chain:'ethereum',contract:'0x'+(i+1).toString(16).padStart(40,'0'),decimals:6,pythFeed:feed,treasury}))};
function transfer(time,amount='1000000',index=0) {return {chain:'ethereum',contract:config.coins[0].contract,txHash:'fixture-receipt',index,from:wallet.address,to:treasury,confirmedAt:time,amountBaseUnits:amount};}
function price(time,spot='100000000',average='100000000') {const o=(t,p)=>({feedId:feed,price:p,expo:-8,publishTime:t});return {provider:'Pyth Benchmarks',confirmedAt:time,spot:o(time,spot),history:Array.from({length:1440},(_,i)=>o(time-(i+1)*60,average))};}
function prices(t) {return {[`${t.chain}:${t.txHash}:${t.index}`]:price(t.confirmedAt)};}
assert.deepEqual(earlyMultiplier(1),[3n,2n]);assert.deepEqual(earlyMultiplier(5),[3n,2n]);assert.deepEqual(earlyMultiplier(6),[41n,28n]);assert.deepEqual(earlyMultiplier(19),[1n,1n]);assert.deepEqual(earlyMultiplier(21),[1n,1n]);assert.deepEqual(lockMultiplier(12),[11n,10n]);assert.deepEqual(lockMultiplier(24),[5n,4n]);
const b=await binding();verifyBinding(b);assert.throws(()=>verifyBinding({...b,sui:'0x'+'cc'.repeat(32)}));assert.throws(()=>verifyBinding({...b,lockMonths:24}));
const secret=new Uint8Array(32).fill(7),source=toBase58(ed25519.getPublicKey(secret)),message=bindingMessage(source,sui,'solana',config.windowStart);
verifyBinding({chain:'solana',windowStart:config.windowStart,source,sui,lockMonths:12,message,signature:toBase58(ed25519.sign(new TextEncoder().encode(message),secret)),lockSignature:toBase58(ed25519.sign(new TextEncoder().encode(lockMessage(message,12)),secret))});
const identity=new Uint8Array(32);identity[0]=1;
const forged=new Uint8Array(64);forged[0]=1;
const fakeSource=toBase58(identity),fakeText=bindingMessage(fakeSource,sui,'solana',config.windowStart);
assert.throws(()=>verifyBinding({chain:'solana',windowStart:config.windowStart,source:fakeSource,sui,lockMonths:0,message:fakeText,signature:toBase58(forged),lockSignature:toBase58(forged)}));
const t=transfer(config.windowStart);const r=score(config,[b],[t],prices(t));assert.equal(r.allocations[0].amountBaseUnits,(15000n*UNIT).toString());assert.equal(r.summary.csvSha256,hash(r.csv));assert.equal(r.summary.allocatedBaseUnits,r.allocations[0].amountBaseUnits);
assert.equal(score(config,[b],[t],prices(t)).csv,r.csv);
for(const months of [0,12,24])for(const day of [1,5,6,18,19,21]) {const tt=transfer(config.windowStart+(day-1)*DAY);const rr=score(config,[await binding(months)],[tt],prices(tt));const [en,ed]=earlyMultiplier(day),[ln,ld]=lockMultiplier(months);assert.equal(BigInt(rr.allocations[0].amountBaseUnits),10000n*UNIT*en*ln/(ed*ld));assert.ok(BigInt(rr.summary.allocatedBaseUnits)<=POOL);}
const huge=transfer(config.windowStart,'100000000000000');assert.equal(score(config,[b],[huge],prices(huge)).summary.allocatedBaseUnits,POOL.toString());
assert.equal(priceAt(price(t.confirmedAt,'200000000','100000000'),feed,t.confirmedAt).used,100000000n);
assert.equal(priceAt(price(t.confirmedAt,'50000000','100000000'),feed,t.confirmedAt).used,50000000n);
assert.throws(()=>priceAt({...price(t.confirmedAt),history:[]},feed,t.confirmedAt));
assert.throws(()=>score(config,[b],[t,t],prices(t)));assert.throws(()=>score(config,[b],[{...t,to:wallet.address}],prices(t)));assert.throws(()=>score({...config,windowStart:null},[b],[t],prices(t)));
const tiny=transfer(config.windowStart,'1');const small=score(config,[b],[tiny],prices(tiny));assert.ok(BigInt(small.summary.allocatedBaseUnits)<=POOL);
const second=await binding(0,'0x'+'dd'.repeat(32));assert.throws(()=>score(config,[b,second],[t],prices(t)));
const equalBindings=[b],equalTransfers=[transfer(config.windowStart+18*DAY,'100000000000000',0)];
for (let i=1;i<=2;i++) {
  const w=new Wallet('0x'+(i+1).toString().repeat(64)),destination='0x'+(i+2).toString(16).repeat(64);
  const m=bindingMessage(w.address,destination,'ethereum',config.windowStart);
  equalBindings.push({chain:'ethereum',windowStart:config.windowStart,source:w.address,sui:destination,lockMonths:0,message:m,signature:await w.signMessage(m),lockSignature:await w.signMessage(lockMessage(m,0))});
  equalTransfers.push({...transfer(config.windowStart+18*DAY,'100000000000000',i),from:w.address});
}
const equalPrices=Object.fromEntries(equalTransfers.map(t=>[`${t.chain}:${t.txHash}:${t.index}`,price(t.confirmedAt)]));
const shared=score(config,equalBindings,equalTransfers,equalPrices);
assert.equal(score(config,[...equalBindings].reverse(),[...equalTransfers].reverse(),equalPrices).csv,shared.csv);
assert.deepEqual(Object.keys(shared.summary.treasuryReceivedBaseUnits),config.coins.map(c=>c.id));
assert.equal(shared.summary.treasuryReceivedBaseUnits.fixture9,'0');
assert.equal(shared.summary.receivedBaseUnits.fixture9,'0');
assert.throws(()=>score({...config,liquidityProceedsPercent:24},[b],[t],prices(t)));
assert.throws(()=>score({...config,coins:config.coins.map((c,i)=>({...c,id:i===1?'fixture0':c.id}))},[b],[t],prices(t)));
assert.equal(BigInt(shared.summary.allocatedBaseUnits),POOL-1n);
assert.ok(shared.allocations.every(a=>BigInt(a.amountBaseUnits)===POOL/3n));
const unbound={...equalTransfers[0],index:99,from:'0x'+'ee'.repeat(20),amountBaseUnits:'123'};
const withUnbound=score(config,equalBindings,[...equalTransfers,unbound],equalPrices);
assert.equal(withUnbound.summary.receivedBaseUnits.fixture0,'300000000000000');
assert.equal(withUnbound.summary.treasuryReceivedBaseUnits.fixture0,'300000000000123');
const prod=JSON.parse(readFileSync(new URL('./config.json',import.meta.url)));assert.equal(prod.coins.length,10);assert.ok(prod.coins.every(c=>c.treasury===''));assert.equal(prod.windowStart,null);
const snapshot=readFileSync(new URL('./snapshots/coingecko-meme-2026-10-03.json',import.meta.url));assert.equal(hash(snapshot),prod.snapshotSha256);
console.log('Feast scorer passed: signed bindings/terms, all multipliers, conservative pricing, cap, exact integer rounding, deterministic hash, rejected duplicates and unset launch inputs.');

const doge = JSON.parse(readFileSync(new URL('./snapshots/dogecoin-binding-vector.json',import.meta.url))).binding;
verifyBinding(doge);
assert.throws(()=>verifyBinding({...doge,signature:doge.lockSignature}));
assert.throws(()=>verifyBinding({...doge,windowStart:doge.windowStart+1}));
const dogeConfig={...config,coins:[{...prod.coins.find(c=>c.id==='dogecoin'),treasury:doge.source},...config.coins.slice(1)]};
const dt={chain:'dogecoin',contract:'native',from:doge.source,to:doge.source,txHash:'ef'.repeat(32),index:0,confirmations:60,inputAddresses:[doge.source],amountBaseUnits:'100000000',confirmedAt:config.windowStart};
const dogePrices={[`dogecoin:${dt.txHash}:0`]:price(dt.confirmedAt)};
// Use the real feed identity with deterministic one-dollar observations.
for(const obs of [dogePrices[`dogecoin:${dt.txHash}:0`].spot,...dogePrices[`dogecoin:${dt.txHash}:0`].history]) obs.feedId=dogeConfig.coins[0].pythFeed;
assert.equal(score(dogeConfig,[doge],[dt],dogePrices).allocations[0].amountBaseUnits,(16500n*UNIT).toString());
assert.throws(()=>score(dogeConfig,[doge],[{...dt,inputAddresses:[]}],dogePrices));
assert.throws(()=>score(dogeConfig,[doge],[{...dt,inputAddresses:[wallet.address]}],dogePrices));
const mm=bindingMessage(wallet.address,sui,'memecore',config.windowStart);
const mb={...b,chain:'memecore',message:mm,signature:await wallet.signMessage(mm),lockSignature:await wallet.signMessage(lockMessage(mm,0))};
verifyBinding(mb); assert.throws(()=>verifyBinding({...mb,chain:'ethereum'}));
const mc={...config,coins:[{...prod.coins.find(c=>c.id==='memecore'),treasury},...config.coins.slice(1)]};
const mt={...t,chain:'memecore',contract:'native',chainId:4352,receiptStatus:'success',receiptKind:'native-transfer',finalized:true,amountBaseUnits:'1000000000000000000'};
const mp={[`memecore:${mt.txHash}:0`]:price(mt.confirmedAt)};
for(const obs of [mp[`memecore:${mt.txHash}:0`].spot,...mp[`memecore:${mt.txHash}:0`].history])obs.feedId=mc.coins[0].pythFeed;
assert.equal(score(mc,[mb],[mt],mp).allocations[0].amountBaseUnits,(15000n*UNIT).toString());
assert.ok(!prod.coins.some(c=>['fartcoin','official-trump'].includes(c.id)));
console.log('Native DOGE/M verified: independent DOGE vector, network/campaign-separated signatures, native receipt/decimal scoring and mixed-input rejection.');
assert.throws(()=>score(dogeConfig,[doge],[{...dt,confirmations:59}],dogePrices));
assert.throws(()=>score(mc,[mb],[{...mt,chainId:1}],mp));
assert.throws(()=>score(mc,[mb],[{...mt,finalized:false}],mp));
